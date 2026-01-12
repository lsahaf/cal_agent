'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'

const COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
]

interface AddFeedDialogProps {
  onAdd: (feed: { name: string; ics_url: string; color: string }) => Promise<void>
}

export function AddFeedDialog({ onAdd }: AddFeedDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [icsUrl, setIcsUrl] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await onAdd({ name, ics_url: icsUrl, color })
      setOpen(false)
      setName('')
      setIcsUrl('')
      setColor(COLORS[0])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add calendar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Calendar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Calendar Feed</DialogTitle>
          <DialogDescription>
            Add a calendar by pasting its ICS URL. You can find this in your
            calendar settings.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Calendar Name</Label>
              <Input
                id="name"
                placeholder="Work Calendar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="icsUrl">ICS URL</Label>
              <Input
                id="icsUrl"
                type="url"
                placeholder="https://calendar.google.com/calendar/ical/..."
                value={icsUrl}
                onChange={(e) => setIcsUrl(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                For Google Calendar: Settings → Calendar → Secret address in iCal format
              </p>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`h-6 w-6 rounded-full transition-transform ${
                      color === c ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : ''
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Calendar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
