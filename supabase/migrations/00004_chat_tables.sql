-- Migration: 00004_chat_tables.sql
-- Chat conversations, messages, and LLM settings

-- Chat conversations
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT,
    context JSONB DEFAULT '{}',  -- Store calendar context, preferences
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',  -- Tool calls, function results, etc.
    token_count INTEGER,
    llm_provider TEXT,
    llm_model TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LLM provider configuration per user
CREATE TABLE public.llm_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    preferred_provider TEXT DEFAULT 'anthropic' CHECK (preferred_provider IN ('anthropic', 'openai')),
    anthropic_model TEXT DEFAULT 'claude-sonnet-4-20250514',
    openai_model TEXT DEFAULT 'gpt-4o',
    custom_instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llm_settings ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can manage their own conversations"
    ON public.conversations FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- Messages policies
CREATE POLICY "Users can manage their own messages"
    ON public.messages FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- LLM settings policies
CREATE POLICY "Users can manage their own LLM settings"
    ON public.llm_settings FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- Indexes
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON public.conversations(updated_at);

-- Update triggers
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_llm_settings_updated_at
    BEFORE UPDATE ON public.llm_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create LLM settings for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_llm_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.llm_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_llm_settings
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_llm_settings();
