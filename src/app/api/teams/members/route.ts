import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - List team members
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

  // Get all members with their profiles and sharing settings
  const { data: members, error } = await supabase
    .from('team_memberships')
    .select(`
      *,
      profile:profiles(id, email, full_name, avatar_url),
      sharing:sharing_settings(visibility_level, share_event_titles, share_event_locations)
    `)
    .eq('team_id', teamId)
    .order('role', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ members })
}

// DELETE - Remove a member (admin/owner only, or self)
export async function DELETE(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const teamId = searchParams.get('teamId')
  const memberId = searchParams.get('memberId')

  if (!teamId || !memberId) {
    return NextResponse.json({ error: 'Team ID and Member ID are required' }, { status: 400 })
  }

  // Get current user's membership
  const { data: currentMembership } = await supabase
    .from('team_memberships')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .single()

  if (!currentMembership) {
    return NextResponse.json({ error: 'Not a member of this team' }, { status: 403 })
  }

  // Get target membership
  const { data: targetMembership } = await supabase
    .from('team_memberships')
    .select('user_id, role')
    .eq('id', memberId)
    .eq('team_id', teamId)
    .single()

  if (!targetMembership) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  // Check permissions
  const isRemovingSelf = targetMembership.user_id === user.id
  const canRemoveOthers = ['owner', 'admin'].includes(currentMembership.role)
  const targetIsOwner = targetMembership.role === 'owner'

  if (targetIsOwner) {
    return NextResponse.json({ error: 'Cannot remove team owner' }, { status: 403 })
  }

  if (!isRemovingSelf && !canRemoveOthers) {
    return NextResponse.json({ error: 'Not authorized to remove members' }, { status: 403 })
  }

  const { error } = await supabase
    .from('team_memberships')
    .delete()
    .eq('id', memberId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
