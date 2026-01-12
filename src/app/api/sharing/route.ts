import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Get sharing settings for a team
export async function GET(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const teamId = searchParams.get('teamId')

  if (!teamId) {
    return NextResponse.json({ error: 'Team ID is required' }, { status: 400 })
  }

  const { data: settings, error } = await supabase
    .from('sharing_settings')
    .select('*')
    .eq('user_id', user.id)
    .eq('team_id', teamId)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Return default settings if none exist
  const defaultSettings = {
    visibility_level: 'free_busy_only',
    share_event_titles: false,
    share_event_locations: false,
  }

  return NextResponse.json({ settings: settings || defaultSettings })
}

// PUT - Update sharing settings
export async function PUT(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { teamId, visibility_level, share_event_titles, share_event_locations } = body

  if (!teamId) {
    return NextResponse.json({ error: 'Team ID is required' }, { status: 400 })
  }

  // Validate visibility level
  if (visibility_level && !['full', 'free_busy_only'].includes(visibility_level)) {
    return NextResponse.json({ error: 'Invalid visibility level' }, { status: 400 })
  }

  // Verify user is a member of this team
  const { data: membership } = await supabase
    .from('team_memberships')
    .select('id')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'Not a member of this team' }, { status: 403 })
  }

  // Upsert settings
  const { data: settings, error } = await supabase
    .from('sharing_settings')
    .upsert({
      user_id: user.id,
      team_id: teamId,
      visibility_level: visibility_level || 'free_busy_only',
      share_event_titles: share_event_titles ?? false,
      share_event_locations: share_event_locations ?? false,
    }, {
      onConflict: 'user_id,team_id',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ settings })
}
