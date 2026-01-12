export interface Team {
  id: string
  name: string
  slug: string
  owner_id: string
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface TeamMembership {
  id: string
  team_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  joined_at: string
  created_at: string
}

export interface TeamMemberWithProfile extends TeamMembership {
  profile: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
  }
}

export interface TeamInvite {
  id: string
  team_id: string
  email: string
  invited_by: string
  token: string
  role: 'admin' | 'member'
  expires_at: string
  accepted_at: string | null
  created_at: string
}

export interface SharingSettings {
  id: string
  user_id: string
  team_id: string
  visibility_level: 'full' | 'free_busy_only'
  share_event_titles: boolean
  share_event_locations: boolean
  created_at: string
  updated_at: string
}

export interface TeamWithMembership extends Team {
  membership: TeamMembership
  member_count: number
}
