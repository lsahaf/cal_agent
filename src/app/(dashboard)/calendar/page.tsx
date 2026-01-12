'use client'

import { useEffect, useState, useCallback } from 'react'
import { Header } from '@/components/layout/header'
import { AddFeedDialog } from '@/components/calendar/add-feed-dialog'
import { FeedList } from '@/components/calendar/feed-list'
import { EventList } from '@/components/calendar/event-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarFeed, CalendarEvent } from '@/types/calendar'
import { addDays, startOfDay, endOfDay } from 'date-fns'

interface EventWithFeed extends CalendarEvent {
  feed: {
    id: string
    name: string
    color: string
  }
}

export default function CalendarPage() {
  const [feeds, setFeeds] = useState<CalendarFeed[]>([])
  const [events, setEvents] = useState<EventWithFeed[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncingFeed, setSyncingFeed] = useState<string | null>(null)

  const fetchFeeds = useCallback(async () => {
    try {
      const res = await fetch('/api/calendars/feeds')
      const data = await res.json()
      setFeeds(data.feeds || [])
    } catch (error) {
      console.error('Failed to fetch feeds:', error)
    }
  }, [])

  const fetchEvents = useCallback(async () => {
    try {
      const start = startOfDay(new Date()).toISOString()
      const end = endOfDay(addDays(new Date(), 14)).toISOString()

      const res = await fetch(`/api/calendars/events?start=${start}&end=${end}`)
      const data = await res.json()
      setEvents(data.events || [])
    } catch (error) {
      console.error('Failed to fetch events:', error)
    }
  }, [])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchFeeds(), fetchEvents()])
      setLoading(false)
    }
    loadData()
  }, [fetchFeeds, fetchEvents])

  const handleAddFeed = async (feed: { name: string; ics_url: string; color: string }) => {
    const res = await fetch('/api/calendars/feeds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feed),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Failed to add calendar')
    }

    await Promise.all([fetchFeeds(), fetchEvents()])
  }

  const handleSyncFeed = async (feedId: string) => {
    setSyncingFeed(feedId)
    try {
      await fetch('/api/calendars/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedId }),
      })
      await Promise.all([fetchFeeds(), fetchEvents()])
    } finally {
      setSyncingFeed(null)
    }
  }

  const handleSyncAll = async () => {
    setSyncing(true)
    try {
      await fetch('/api/calendars/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      await Promise.all([fetchFeeds(), fetchEvents()])
    } finally {
      setSyncing(false)
    }
  }

  const handleDeleteFeed = async (feedId: string) => {
    if (!confirm('Are you sure you want to remove this calendar?')) return

    await fetch(`/api/calendars/feeds?id=${feedId}`, {
      method: 'DELETE',
    })
    await Promise.all([fetchFeeds(), fetchEvents()])
  }

  const handleToggleVisibility = (feedId: string, visible: boolean) => {
    setFeeds((prev) =>
      prev.map((f) => (f.id === feedId ? { ...f, is_visible: visible } : f))
    )
  }

  // Filter events by visible feeds
  const visibleFeedIds = new Set(feeds.filter((f) => f.is_visible).map((f) => f.id))
  const visibleEvents = events.filter((e) => visibleFeedIds.has(e.feed_id))

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <Header title="Calendar" />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <Header title="Calendar" onSync={handleSyncAll} syncing={syncing} />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Calendar Feeds */}
        <div className="w-80 border-r p-4 overflow-auto">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Calendars</h2>
            <AddFeedDialog onAdd={handleAddFeed} />
          </div>
          <FeedList
            feeds={feeds}
            onSync={handleSyncFeed}
            onDelete={handleDeleteFeed}
            onToggleVisibility={handleToggleVisibility}
            syncingFeed={syncingFeed}
          />

          {feeds.length === 0 && (
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">How to get your ICS URL</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <p><strong>Google Calendar:</strong></p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Open Google Calendar settings</li>
                  <li>Click on the calendar you want to add</li>
                  <li>Scroll to "Secret address in iCal format"</li>
                  <li>Copy the URL</li>
                </ol>
                <p className="pt-2"><strong>Outlook:</strong></p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Go to Outlook Calendar settings</li>
                  <li>Select "Shared calendars"</li>
                  <li>Publish a calendar and copy the ICS link</li>
                </ol>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content - Events */}
        <div className="flex-1 overflow-auto p-6">
          {feeds.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="rounded-lg border border-dashed p-12">
                <h2 className="text-lg font-semibold">No calendars connected</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Add your first calendar to see your events here
                </p>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="mb-4 text-lg font-semibold">Upcoming Events</h2>
              <EventList events={visibleEvents} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
