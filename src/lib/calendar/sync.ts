import { SupabaseClient } from '@supabase/supabase-js'
import { fetchAndParseICS } from './ics-parser'
import type { CalendarFeed, SyncResult } from '@/types/calendar'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>

export async function syncCalendarFeed(
  supabase: AnySupabaseClient,
  feed: CalendarFeed
): Promise<SyncResult> {
  try {
    // Fetch and parse the ICS feed
    const parsedEvents = await fetchAndParseICS(feed.ics_url)

    // Get existing events for this feed
    const { data: existingEvents } = await supabase
      .from('events')
      .select('id, uid')
      .eq('feed_id', feed.id)

    const existingUids = new Set(existingEvents?.map((e) => e.uid) || [])
    const newUids = new Set(parsedEvents.map((e) => e.uid))

    let eventsAdded = 0
    let eventsUpdated = 0
    let eventsRemoved = 0

    // Upsert events
    for (const event of parsedEvents) {
      const eventData = {
        feed_id: feed.id,
        user_id: feed.user_id,
        uid: event.uid,
        title: event.title,
        description: event.description || null,
        location: event.location || null,
        start_time: event.start_time.toISOString(),
        end_time: event.end_time.toISOString(),
        all_day: event.all_day,
        status: event.status || null,
        recurrence_rule: event.recurrence_rule || null,
      }

      const { error } = await supabase
        .from('events')
        .upsert(eventData, { onConflict: 'feed_id,uid' })

      if (error) {
        console.error('Error upserting event:', error)
        continue
      }

      if (existingUids.has(event.uid)) {
        eventsUpdated++
      } else {
        eventsAdded++
      }
    }

    // Remove events that no longer exist in the feed
    const uidsToRemove = Array.from(existingUids).filter((uid) => !newUids.has(uid))
    if (uidsToRemove.length > 0) {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('feed_id', feed.id)
        .in('uid', uidsToRemove)

      if (!error) {
        eventsRemoved = uidsToRemove.length
      }
    }

    // Update feed's last_synced_at
    await supabase
      .from('calendar_feeds')
      .update({ last_synced_at: new Date().toISOString(), last_sync_error: null })
      .eq('id', feed.id)

    return {
      success: true,
      eventsAdded,
      eventsUpdated,
      eventsRemoved,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Update feed with error
    await supabase
      .from('calendar_feeds')
      .update({ last_sync_error: errorMessage })
      .eq('id', feed.id)

    return {
      success: false,
      eventsAdded: 0,
      eventsUpdated: 0,
      eventsRemoved: 0,
      error: errorMessage,
    }
  }
}

export async function syncAllFeeds(
  supabase: AnySupabaseClient,
  userId: string
): Promise<{ results: SyncResult[]; totalEvents: number }> {
  const { data: feeds } = await supabase
    .from('calendar_feeds')
    .select('*')
    .eq('user_id', userId)

  if (!feeds || feeds.length === 0) {
    return { results: [], totalEvents: 0 }
  }

  const results: SyncResult[] = []
  for (const feed of feeds) {
    const result = await syncCalendarFeed(supabase, feed)
    results.push(result)
  }

  const totalEvents = results.reduce(
    (sum, r) => sum + r.eventsAdded + r.eventsUpdated,
    0
  )

  return { results, totalEvents }
}
