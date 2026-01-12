'use client'

import { format, isToday, isTomorrow, isThisWeek, parseISO } from 'date-fns'
import { CalendarEvent } from '@/types/calendar'
import { MapPin, Clock } from 'lucide-react'

interface EventWithFeed extends CalendarEvent {
  feed: {
    id: string
    name: string
    color: string
  }
}

interface EventListProps {
  events: EventWithFeed[]
}

function formatEventDate(dateStr: string): string {
  const date = parseISO(dateStr)
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  if (isThisWeek(date)) return format(date, 'EEEE')
  return format(date, 'MMM d')
}

function formatEventTime(startStr: string, endStr: string, allDay: boolean): string {
  if (allDay) return 'All day'
  const start = parseISO(startStr)
  const end = parseISO(endStr)
  return `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`
}

function groupEventsByDate(events: EventWithFeed[]): Map<string, EventWithFeed[]> {
  const groups = new Map<string, EventWithFeed[]>()

  for (const event of events) {
    const dateKey = format(parseISO(event.start_time), 'yyyy-MM-dd')
    const existing = groups.get(dateKey) || []
    existing.push(event)
    groups.set(dateKey, existing)
  }

  return groups
}

export function EventList({ events }: EventListProps) {
  if (events.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No events to display
      </div>
    )
  }

  const groupedEvents = groupEventsByDate(events)
  const sortedDates = Array.from(groupedEvents.keys()).sort()

  return (
    <div className="space-y-6">
      {sortedDates.map((dateKey) => {
        const dayEvents = groupedEvents.get(dateKey)!
        const firstEvent = dayEvents[0]

        return (
          <div key={dateKey}>
            <h3 className="mb-3 font-semibold text-muted-foreground">
              {formatEventDate(firstEvent.start_time)}
              <span className="ml-2 text-sm font-normal">
                {format(parseISO(firstEvent.start_time), 'MMM d, yyyy')}
              </span>
            </h3>
            <div className="space-y-2">
              {dayEvents.map((event) => (
                <div
                  key={event.id}
                  className="rounded-lg border p-3 transition-colors hover:bg-accent/50"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="mt-1.5 h-2 w-2 rounded-full"
                      style={{ backgroundColor: event.feed?.color || '#3b82f6' }}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{event.title}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatEventTime(
                            event.start_time,
                            event.end_time,
                            event.all_day
                          )}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </span>
                        )}
                      </div>
                      {event.description && (
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
