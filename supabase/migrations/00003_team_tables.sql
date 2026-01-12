-- Migration: 00003_team_tables.sql
-- Teams, memberships, invites, and sharing settings

-- Teams table
CREATE TABLE public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team memberships
CREATE TABLE public.team_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- Team invites
CREATE TABLE public.team_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, email)
);

-- User sharing settings per team
CREATE TABLE public.sharing_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    visibility_level TEXT NOT NULL DEFAULT 'free_busy_only' CHECK (visibility_level IN ('full', 'free_busy_only')),
    share_event_titles BOOLEAN DEFAULT FALSE,
    share_event_locations BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, team_id)
);

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sharing_settings ENABLE ROW LEVEL SECURITY;

-- Team policies
CREATE POLICY "Team members can view their teams"
    ON public.teams FOR SELECT
    TO authenticated
    USING (
        id IN (
            SELECT team_id FROM public.team_memberships
            WHERE user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Users can create teams"
    ON public.teams FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = owner_id);

CREATE POLICY "Team owners and admins can update teams"
    ON public.teams FOR UPDATE
    TO authenticated
    USING (
        id IN (
            SELECT team_id FROM public.team_memberships
            WHERE user_id = (SELECT auth.uid())
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Team owners can delete teams"
    ON public.teams FOR DELETE
    TO authenticated
    USING ((SELECT auth.uid()) = owner_id);

-- Team memberships policies
CREATE POLICY "Team members can view memberships"
    ON public.team_memberships FOR SELECT
    TO authenticated
    USING (
        team_id IN (
            SELECT team_id FROM public.team_memberships
            WHERE user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Team owners and admins can manage memberships"
    ON public.team_memberships FOR INSERT
    TO authenticated
    WITH CHECK (
        team_id IN (
            SELECT team_id FROM public.team_memberships
            WHERE user_id = (SELECT auth.uid())
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Users can leave teams"
    ON public.team_memberships FOR DELETE
    TO authenticated
    USING (
        user_id = (SELECT auth.uid()) OR
        team_id IN (
            SELECT team_id FROM public.team_memberships
            WHERE user_id = (SELECT auth.uid())
            AND role IN ('owner', 'admin')
        )
    );

-- Team invites policies
CREATE POLICY "Team owners and admins can manage invites"
    ON public.team_invites FOR ALL
    TO authenticated
    USING (
        team_id IN (
            SELECT team_id FROM public.team_memberships
            WHERE user_id = (SELECT auth.uid())
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Anyone can view invites by token for accepting"
    ON public.team_invites FOR SELECT
    TO authenticated
    USING (TRUE);

-- Sharing settings policies
CREATE POLICY "Users can manage their own sharing settings"
    ON public.sharing_settings FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Team members can view each other's sharing settings"
    ON public.sharing_settings FOR SELECT
    TO authenticated
    USING (
        team_id IN (
            SELECT team_id FROM public.team_memberships
            WHERE user_id = (SELECT auth.uid())
        )
    );

-- Indexes
CREATE INDEX idx_team_memberships_team_id ON public.team_memberships(team_id);
CREATE INDEX idx_team_memberships_user_id ON public.team_memberships(user_id);
CREATE INDEX idx_team_invites_token ON public.team_invites(token);
CREATE INDEX idx_team_invites_email ON public.team_invites(email);
CREATE INDEX idx_sharing_settings_user_team ON public.sharing_settings(user_id, team_id);

-- Update triggers
CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON public.teams
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sharing_settings_updated_at
    BEFORE UPDATE ON public.sharing_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create team membership when team is created
CREATE OR REPLACE FUNCTION public.handle_new_team()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.team_memberships (team_id, user_id, role)
    VALUES (NEW.id, NEW.owner_id, 'owner');
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_team_created
    AFTER INSERT ON public.teams
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_team();

-- Function to auto-create sharing settings when joining team
CREATE OR REPLACE FUNCTION public.handle_team_join()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.sharing_settings (user_id, team_id, visibility_level)
    VALUES (NEW.user_id, NEW.team_id, 'free_busy_only')
    ON CONFLICT (user_id, team_id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_team_membership_created
    AFTER INSERT ON public.team_memberships
    FOR EACH ROW EXECUTE FUNCTION public.handle_team_join();
