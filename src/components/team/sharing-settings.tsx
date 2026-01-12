'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff } from 'lucide-react'

interface SharingSettingsProps {
  teamId: string
}

export function SharingSettings({ teamId }: SharingSettingsProps) {
  const [visibility, setVisibility] = useState<'full' | 'free_busy_only'>('free_busy_only')
  const [shareTitles, setShareTitles] = useState(false)
  const [shareLocations, setShareLocations] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [teamId])

  const fetchSettings = async () => {
    try {
      const res = await fetch(`/api/sharing?teamId=${teamId}`)
      if (res.ok) {
        const data = await res.json()
        setVisibility(data.settings.visibility_level)
        setShareTitles(data.settings.share_event_titles)
        setShareLocations(data.settings.share_event_locations)
      }
    } catch (error) {
      console.error('Failed to fetch sharing settings:', error)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setSaved(false)

    try {
      const res = await fetch('/api/sharing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          visibility_level: visibility,
          share_event_titles: shareTitles,
          share_event_locations: shareLocations,
        }),
      })

      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your Sharing Settings</CardTitle>
        <CardDescription>
          Control what team members can see about your calendar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Label>Calendar Visibility</Label>
          <div className="space-y-2">
            <label className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/50">
              <input
                type="radio"
                name="visibility"
                value="free_busy_only"
                checked={visibility === 'free_busy_only'}
                onChange={() => setVisibility('free_busy_only')}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 font-medium">
                  <EyeOff className="h-4 w-4" />
                  Free/Busy Only
                </div>
                <p className="text-sm text-muted-foreground">
                  Team members see when you&apos;re busy but not event details
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/50">
              <input
                type="radio"
                name="visibility"
                value="full"
                checked={visibility === 'full'}
                onChange={() => setVisibility('full')}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 font-medium">
                  <Eye className="h-4 w-4" />
                  Full Calendar
                </div>
                <p className="text-sm text-muted-foreground">
                  Team members can see your event details
                </p>
              </div>
            </label>
          </div>
        </div>

        {visibility === 'full' && (
          <div className="space-y-2 pl-4 border-l-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={shareTitles}
                onChange={(e) => setShareTitles(e.target.checked)}
              />
              <span className="text-sm">Share event titles</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={shareLocations}
                onChange={(e) => setShareLocations(e.target.checked)}
              />
              <span className="text-sm">Share event locations</span>
            </label>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
          {saved && (
            <span className="text-sm text-green-600">Settings saved!</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
