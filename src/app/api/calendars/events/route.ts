import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Get events within a date range
export async function GET(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('start')
  const endDate = searchParams.get('end')
  const feedIds = searchParams.get('feeds')?.split(',').filter(Boolean)

  let query = supabase
    .from('events')
    .select(`
      *,
      feed:calendar_feeds(id, name, color)
    `)
    .eq('user_id', user.id)
    .order('start_time', { ascending: true })

  if (startDate) {
    query = query.gte('start_time', startDate)
  }

  if (endDate) {
    query = query.lte('end_time', endDate)
  }

  if (feedIds && feedIds.length > 0) {
    query = query.in('feed_id', feedIds)
  }

  const { data: events, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ events })
}
