import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - List pending invites for a team
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

  // Verify user is admin/owner of this team
  const { data: membership } = await supabase
    .from('team_memberships')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .single()

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const { data: invites, error } = await supabase
    .from('team_invites')
    .select('*')
    .eq('team_id', teamId)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ invites })
}

// POST - Create a new invite
export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { teamId, email, role = 'member' } = body

  if (!teamId || !email) {
    return NextResponse.json({ error: 'Team ID and email are required' }, { status: 400 })
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
  }

  // Verify user is admin/owner of this team
  const { data: membership } = await supabase
    .from('team_memberships')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .single()

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Not authorized to invite members' }, { status: 403 })
  }

  // Check if user is already a member
  const { data: existingMember } = await supabase
    .from('team_memberships')
    .select('id, profile:profiles(email)')
    .eq('team_id', teamId)

  const memberEmails = existingMember?.map((m: any) => m.profile?.email) || []
  if (memberEmails.includes(email.toLowerCase())) {
    return NextResponse.json({ error: 'User is already a team member' }, { status: 409 })
  }

  // Check for existing pending invite
  const { data: existingInvite } = await supabase
    .from('team_invites')
    .select('id')
    .eq('team_id', teamId)
    .eq('email', email.toLowerCase())
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (existingInvite) {
    return NextResponse.json({ error: 'An invite is already pending for this email' }, { status: 409 })
  }

  // Create invite
  const { data: invite, error } = await supabase
    .from('team_invites')
    .insert({
      team_id: teamId,
      email: email.toLowerCase(),
      invited_by: user.id,
      role: role === 'admin' ? 'admin' : 'member',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // TODO: Send invite email via Edge Function or email service

  return NextResponse.json({ invite }, { status: 201 })
}

// DELETE - Cancel an invite
export async function DELETE(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const inviteId = searchParams.get('id')

  if (!inviteId) {
    return NextResponse.json({ error: 'Invite ID is required' }, { status: 400 })
  }

  // Get invite and verify permissions
  const { data: invite } = await supabase
    .from('team_invites')
    .select('team_id')
    .eq('id', inviteId)
    .single()

  if (!invite) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
  }

  // Verify user is admin/owner of this team
  const { data: membership } = await supabase
    .from('team_memberships')
    .select('role')
    .eq('team_id', invite.team_id)
    .eq('user_id', user.id)
    .single()

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const { error } = await supabase
    .from('team_invites')
    .delete()
    .eq('id', inviteId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
