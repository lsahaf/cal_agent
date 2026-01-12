'use client'

import { CalendarFeed } from '@/types/calendar'
import { Button } from '@/components/ui/button'
import { RefreshCw, Trash2, Eye, EyeOff } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface FeedListProps {
  feeds: CalendarFeed[]
  onSync: (feedId: string) => Promise<void>
  onDelete: (feedId: string) => Promise<void>
  onToggleVisibility: (feedId: string, visible: boolean) => void
  syncingFeed: string | null
}

export function FeedList({
  feeds,
  onSync,
  onDelete,
  onToggleVisibility,
  syncingFeed,
}: FeedListProps) {
  if (feeds.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-muted-foreground">
        No calendars added yet
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {feeds.map((feed) => (
        <div
          key={feed.id}
          className="flex items-center justify-between rounded-lg border p-3"
        >
          <div className="flex items-center gap-3">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: feed.color }}
            />
            <div>
              <div className="font-medium">{feed.name}</div>
              <div className="text-xs text-muted-foreground">
                {feed.last_synced_at
                  ? `Synced ${formatDistanceToNow(new Date(feed.last_synced_at))} ago`
                  : 'Never synced'}
                {feed.last_sync_error && (
                  <span className="ml-2 text-destructive">
                    Error: {feed.last_sync_error}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleVisibility(feed.id, !feed.is_visible)}
              title={feed.is_visible ? 'Hide calendar' : 'Show calendar'}
            >
              {feed.is_visible ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onSync(feed.id)}
              disabled={syncingFeed === feed.id}
              title="Sync calendar"
            >
              <RefreshCw
                className={`h-4 w-4 ${syncingFeed === feed.id ? 'animate-spin' : ''}`}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(feed.id)}
              title="Remove calendar"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
