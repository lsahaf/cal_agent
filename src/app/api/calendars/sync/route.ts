import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncAllFeeds, syncCalendarFeed } from '@/lib/calendar/sync'

// POST - Sync calendars
export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const { feedId } = body

  if (feedId) {
    // Sync a specific feed
    const { data: feed, error } = await supabase
      .from('calendar_feeds')
      .select('*')
      .eq('id', feedId)
      .eq('user_id', user.id)
      .single()

    if (error || !feed) {
      return NextResponse.json({ error: 'Feed not found' }, { status: 404 })
    }

    const result = await syncCalendarFeed(supabase, feed)
    return NextResponse.json({ result })
  }

  // Sync all feeds
  const { results, totalEvents } = await syncAllFeeds(supabase, user.id)
  return NextResponse.json({ results, totalEvents })
}
