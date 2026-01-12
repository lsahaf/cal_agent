export interface CalendarFeed {
  id: string
  user_id: string
  name: string
  ics_url: string
  color: string
  is_visible: boolean
  last_synced_at: string | null
  last_sync_error: string | null
  created_at: string
  updated_at: string
}

export interface CalendarEvent {
  id: string
  feed_id: string
  user_id: string
  uid: string
  title: string
  description: string | null
  location: string | null
  start_time: string
  end_time: string
  all_day: boolean
  status: 'confirmed' | 'tentative' | 'cancelled' | null
  recurrence_rule: string | null
  created_at: string
  updated_at: string
}

export interface ParsedEvent {
  uid: string
  title: string
  description?: string
  location?: string
  start_time: Date
  end_time: Date
  all_day: boolean
  status?: 'confirmed' | 'tentative' | 'cancelled'
  recurrence_rule?: string
}

export interface SyncResult {
  success: boolean
  eventsAdded: number
  eventsUpdated: number
  eventsRemoved: number
  error?: string
}
