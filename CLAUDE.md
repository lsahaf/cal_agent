# CLAUDE.md - Project Context for AI Assistants

## Project Overview

**CalAgent** is a calendar aggregation and AI scheduling assistant webapp that:
- Integrates multiple Google and Outlook calendars via ICS feeds (no OAuth required)
- Provides a unified calendar view
- Supports teams with configurable sharing settings
- Features an AI chat agent for availability queries and meeting scheduling

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **UI Components**: shadcn/ui (Radix primitives)
- **Backend**: Next.js API routes + Supabase
- **Database**: PostgreSQL via Supabase
- **Auth**: Supabase Auth (email/password, magic link)
- **Calendar Parsing**: ical.js for ICS feed parsing
- **LLM**: Multi-provider support planned (Claude API + OpenAI)

## Project Structure

```
cal_agent/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Auth pages (login, signup, callback)
│   │   ├── (dashboard)/          # Protected pages with sidebar layout
│   │   │   ├── calendar/         # Calendar view + feed management
│   │   │   ├── chat/             # AI chat interface
│   │   │   ├── team/             # Team management + invite acceptance
│   │   │   └── settings/         # User settings
│   │   └── api/                  # API routes
│   │       ├── calendars/        # feeds, sync, events endpoints
│   │       ├── teams/            # teams, members, invites endpoints
│   │       └── sharing/          # sharing settings endpoint
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── calendar/             # Calendar-specific components
│   │   ├── team/                 # Team management components
│   │   └── layout/               # Header, Sidebar
│   ├── lib/
│   │   ├── supabase/             # Supabase clients (browser, server, middleware)
│   │   ├── calendar/             # ICS parsing and sync logic
│   │   └── utils.ts              # cn() utility for classnames
│   ├── types/                    # TypeScript type definitions
│   └── middleware.ts             # Auth middleware for route protection
├── supabase/
│   └── migrations/               # SQL migrations (run in order)
└── public/
```

## Database Schema

### Core Tables

1. **profiles** - User profiles (extends Supabase auth.users)
   - id, email, full_name, avatar_url, timezone, preferences

2. **calendar_feeds** - ICS calendar feed URLs
   - id, user_id, name, ics_url, color, is_visible, last_synced_at, last_sync_error

3. **events** - Parsed calendar events
   - id, feed_id, user_id, uid, title, description, location, start_time, end_time, all_day, status, recurrence_rule

4. **teams** - Team information
   - id, name, slug, owner_id, settings

5. **team_memberships** - User-team relationships
   - id, team_id, user_id, role (owner/admin/member), joined_at

6. **team_invites** - Pending email invitations
   - id, team_id, email, invited_by, token, role, expires_at, accepted_at

7. **sharing_settings** - Per-user privacy settings per team
   - id, user_id, team_id, visibility_level (full/free_busy_only), share_event_titles, share_event_locations

8. **conversations** - Chat conversations (for AI agent)
   - id, user_id, title, context

9. **messages** - Chat messages
   - id, conversation_id, user_id, role (user/assistant/system), content, metadata

10. **llm_settings** - User LLM preferences
    - id, user_id, preferred_provider, anthropic_model, openai_model

### Row Level Security (RLS)

All tables have RLS enabled. Key policies:
- Users can only access their own data
- Team members can view each other's data based on sharing_settings
- Admins/owners can manage team invites and members

## Key Architecture Decisions

### Calendar Integration (ICS vs OAuth)
- **Decision**: Use ICS feeds instead of OAuth
- **Rationale**: Much simpler implementation, no app registration required
- **Trade-off**: Read-only access, no real-time webhooks
- **How it works**: Users paste their calendar's secret ICS URL from Google/Outlook settings

### Authentication Flow
- Supabase Auth handles primary login (email/password, magic link)
- Middleware refreshes sessions on every request
- Protected routes redirect to /login if not authenticated

### Team Sharing Model
- Users choose visibility per team: "full" or "free_busy_only"
- Full: team sees event titles, descriptions, locations
- Free/busy: team only sees time blocks marked as busy

## Running the Project

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in Supabase URL, anon key, service role key

# Run development server
npm run dev

# Build for production
npm run build
```

## Environment Variables Required

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# For Phase 4 (AI Chat)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
```

## Current Implementation Status

### ✅ Phase 1: Foundation (Complete)
- Next.js project setup with TypeScript, Tailwind, shadcn/ui
- Supabase auth with middleware protection
- Basic layout with sidebar navigation
- Login/signup pages

### ✅ Phase 2: Calendar Integration (Complete)
- ICS feed management (add, sync, delete)
- Event parsing with ical.js
- Unified event list view
- On-demand sync functionality

### ✅ Phase 3: Team Management (Complete)
- Create/delete teams
- Invite members by email
- Accept invites via token URL
- Role-based permissions (owner/admin/member)
- Configurable sharing settings

### ⏳ Phase 4: AI Chat Agent (Not Started)
- LLM provider abstraction (Claude + OpenAI)
- Agent tools for availability queries
- Streaming chat interface
- Team availability queries

### ⏳ Phase 5: Polish & Testing (Not Started)
- Loading states and error handling
- Mobile responsiveness
- Testing

## Code Patterns & Conventions

### API Routes
- All routes check authentication first
- Return JSON with `{ data }` or `{ error }` structure
- Use proper HTTP status codes

### Components
- Client components marked with 'use client'
- Server components are default
- Use shadcn/ui primitives for consistency

### Supabase Clients
- `createClient()` from `@/lib/supabase/client` - browser
- `createClient()` from `@/lib/supabase/server` - server components/API routes
- `createServiceClient()` - for admin operations (bypasses RLS)

### Type Safety
- Types defined in `src/types/`
- Supabase client uses `any` type for flexibility (generated types can be added later)

## Common Tasks

### Adding a new API route
1. Create file in `src/app/api/[route]/route.ts`
2. Export async functions: GET, POST, PUT, DELETE
3. Check auth with `supabase.auth.getUser()`
4. Return `NextResponse.json()`

### Adding a new shadcn/ui component
1. Check if it exists in `src/components/ui/`
2. If not, copy from shadcn/ui docs or use CLI
3. Install any required Radix dependencies

### Adding a database migration
1. Create new file in `supabase/migrations/` with incremented number
2. Write SQL with CREATE TABLE, RLS policies, indexes
3. Run via Supabase dashboard or CLI

## AI Agent Tools (Phase 4 - Planned)

```typescript
// Tools the AI agent will have access to:
- get_my_availability(start_date, end_date, duration_minutes)
- get_team_member_availability(user_id, start_date, end_date)
- get_team_availability(team_id, start_date, end_date)
- get_my_events(start_date, end_date)
- suggest_meeting_times(attendees[], duration, preferences)
- list_team_members(team_id)
```

## Useful Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # Run ESLint
```
