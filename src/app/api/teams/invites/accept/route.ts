import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Accept an invite
export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { token } = body

  if (!token) {
    return NextResponse.json({ error: 'Invite token is required' }, { status: 400 })
  }

  // Get user's email
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
  }

  // Find the invite
  const { data: invite, error: inviteError } = await supabase
    .from('team_invites')
    .select('*, team:teams(name)')
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (inviteError || !invite) {
    return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 })
  }

  // Verify email matches
  if (invite.email.toLowerCase() !== profile.email.toLowerCase()) {
    return NextResponse.json({
      error: 'This invite was sent to a different email address'
    }, { status: 403 })
  }

  // Check if already a member
  const { data: existingMembership } = await supabase
    .from('team_memberships')
    .select('id')
    .eq('team_id', invite.team_id)
    .eq('user_id', user.id)
    .single()

  if (existingMembership) {
    return NextResponse.json({ error: 'You are already a member of this team' }, { status: 409 })
  }

  // Create membership
  const { error: membershipError } = await supabase
    .from('team_memberships')
    .insert({
      team_id: invite.team_id,
      user_id: user.id,
      role: invite.role,
    })

  if (membershipError) {
    return NextResponse.json({ error: membershipError.message }, { status: 500 })
  }

  // Mark invite as accepted
  await supabase
    .from('team_invites')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invite.id)

  return NextResponse.json({
    success: true,
    team: invite.team,
  })
}

// GET - Get invite details by token (for preview before accepting)
export async function GET(request: Request) {
  const supabase = await createClient()

  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  const { data: invite, error } = await supabase
    .from('team_invites')
    .select('id, email, role, expires_at, team:teams(id, name)')
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !invite) {
    return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 })
  }

  return NextResponse.json({ invite })
}
