import ICAL from 'ical.js'
import type { ParsedEvent } from '@/types/calendar'

export function parseICS(icsData: string): ParsedEvent[] {
  const events: ParsedEvent[] = []

  try {
    const jcalData = ICAL.parse(icsData)
    const comp = new ICAL.Component(jcalData)
    const vevents = comp.getAllSubcomponents('vevent')

    for (const vevent of vevents) {
      const event = new ICAL.Event(vevent)

      // Skip events without required fields
      if (!event.uid || !event.startDate) {
        continue
      }

      const startDate = event.startDate.toJSDate()
      const endDate = event.endDate?.toJSDate() || startDate

      // Check if it's an all-day event
      const allDay = event.startDate.isDate

      // Get status
      const statusProp = vevent.getFirstPropertyValue('status')
      let status: 'confirmed' | 'tentative' | 'cancelled' | undefined
      if (statusProp) {
        const statusLower = statusProp.toString().toLowerCase()
        if (statusLower === 'confirmed') status = 'confirmed'
        else if (statusLower === 'tentative') status = 'tentative'
        else if (statusLower === 'cancelled') status = 'cancelled'
      }

      // Get recurrence rule
      const rruleProp = vevent.getFirstPropertyValue('rrule')
      const recurrenceRule = rruleProp?.toString()

      events.push({
        uid: event.uid,
        title: event.summary || 'Untitled Event',
        description: event.description || undefined,
        location: event.location || undefined,
        start_time: startDate,
        end_time: endDate,
        all_day: allDay,
        status,
        recurrence_rule: recurrenceRule,
      })
    }
  } catch (error) {
    console.error('Error parsing ICS data:', error)
    throw new Error('Failed to parse calendar data')
  }

  return events
}

export async function fetchAndParseICS(url: string): Promise<ParsedEvent[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'text/calendar',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch calendar: ${response.status} ${response.statusText}`)
    }

    const icsData = await response.text()
    return parseICS(icsData)
  } catch (error) {
    console.error('Error fetching ICS:', error)
    throw error
  }
}
