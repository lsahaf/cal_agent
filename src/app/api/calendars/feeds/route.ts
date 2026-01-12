import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncCalendarFeed } from '@/lib/calendar/sync'

// GET - List all calendar feeds
export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: feeds, error } = await supabase
    .from('calendar_feeds')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ feeds })
}

// POST - Add a new calendar feed
export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, ics_url, color } = body

  if (!name || !ics_url) {
    return NextResponse.json(
      { error: 'Name and ICS URL are required' },
      { status: 400 }
    )
  }

  // Validate URL format
  try {
    new URL(ics_url)
  } catch {
    return NextResponse.json(
      { error: 'Invalid URL format' },
      { status: 400 }
    )
  }

  // Insert the feed
  const { data: feed, error } = await supabase
    .from('calendar_feeds')
    .insert({
      user_id: user.id,
      name,
      ics_url,
      color: color || '#3b82f6',
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'This calendar URL is already added' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Sync the feed immediately
  const syncResult = await syncCalendarFeed(supabase, feed)

  return NextResponse.json({ feed, syncResult }, { status: 201 })
}

// DELETE - Remove a calendar feed
export async function DELETE(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const feedId = searchParams.get('id')

  if (!feedId) {
    return NextResponse.json({ error: 'Feed ID is required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('calendar_feeds')
    .delete()
    .eq('id', feedId)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
