-- Migration: 00002_calendar_tables.sql
-- Calendar feeds and events tables (ICS-based)

-- Connected calendar feeds (ICS URLs)
CREATE TABLE public.calendar_feeds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    ics_url TEXT NOT NULL,
    color TEXT DEFAULT '#3b82f6',
    is_visible BOOLEAN DEFAULT TRUE,
    last_synced_at TIMESTAMPTZ,
    last_sync_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, ics_url)
);

-- Calendar events (parsed from ICS feeds)
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feed_id UUID NOT NULL REFERENCES public.calendar_feeds(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    uid TEXT NOT NULL,  -- ICS UID
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    all_day BOOLEAN DEFAULT FALSE,
    status TEXT CHECK (status IN ('confirmed', 'tentative', 'cancelled')),
    recurrence_rule TEXT,  -- RRULE string
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(feed_id, uid)
);

-- Enable RLS
ALTER TABLE public.calendar_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Calendar feeds policies
CREATE POLICY "Users can manage their own calendar feeds"
    ON public.calendar_feeds FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- Events policies (users can see their own events)
CREATE POLICY "Users can manage their own events"
    ON public.events FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- Team members can view events based on sharing settings
-- This policy allows team members to see events if sharing is enabled
CREATE POLICY "Team members can view shared events"
    ON public.events FOR SELECT
    TO authenticated
    USING (
        user_id IN (
            SELECT tm2.user_id
            FROM public.team_memberships tm1
            JOIN public.team_memberships tm2 ON tm1.team_id = tm2.team_id
            JOIN public.sharing_settings ss ON ss.user_id = tm2.user_id AND ss.team_id = tm1.team_id
            WHERE tm1.user_id = (SELECT auth.uid())
            AND ss.visibility_level = 'full'
        )
    );

-- Indexes for performance
CREATE INDEX idx_events_user_id ON public.events(user_id);
CREATE INDEX idx_events_feed_id ON public.events(feed_id);
CREATE INDEX idx_events_start_time ON public.events(start_time);
CREATE INDEX idx_events_end_time ON public.events(end_time);
CREATE INDEX idx_events_user_time_range ON public.events(user_id, start_time, end_time);
CREATE INDEX idx_calendar_feeds_user_id ON public.calendar_feeds(user_id);

-- Update triggers
CREATE TRIGGER update_calendar_feeds_updated_at
    BEFORE UPDATE ON public.calendar_feeds
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
