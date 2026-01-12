import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - List user's teams
export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: memberships, error } = await supabase
    .from('team_memberships')
    .select(`
      *,
      team:teams(*)
    `)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get member counts for each team
  const teams = await Promise.all(
    (memberships || []).map(async (m) => {
      const { count } = await supabase
        .from('team_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', m.team_id)

      return {
        ...m.team,
        membership: {
          id: m.id,
          role: m.role,
          joined_at: m.joined_at,
        },
        member_count: count || 0,
      }
    })
  )

  return NextResponse.json({ teams })
}

// POST - Create a new team
export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name } = body

  if (!name || name.trim().length === 0) {
    return NextResponse.json({ error: 'Team name is required' }, { status: 400 })
  }

  // Generate slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + Math.random().toString(36).substring(2, 8)

  const { data: team, error } = await supabase
    .from('teams')
    .insert({
      name: name.trim(),
      slug,
      owner_id: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ team }, { status: 201 })
}

// DELETE - Delete a team (owner only)
export async function DELETE(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const teamId = searchParams.get('id')

  if (!teamId) {
    return NextResponse.json({ error: 'Team ID is required' }, { status: 400 })
  }

  // Verify user is owner
  const { data: team } = await supabase
    .from('teams')
    .select('owner_id')
    .eq('id', teamId)
    .single()

  if (!team || team.owner_id !== user.id) {
    return NextResponse.json({ error: 'Not authorized to delete this team' }, { status: 403 })
  }

  const { error } = await supabase
    .from('teams')
    .delete()
    .eq('id', teamId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
