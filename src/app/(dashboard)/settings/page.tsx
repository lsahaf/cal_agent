import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
  return (
    <div className="flex h-full flex-col">
      <Header title="Settings" />
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Manage your account settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" disabled placeholder="you@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" placeholder="America/New_York" />
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>
                Manage your connected calendar accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                No calendar accounts connected yet.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Preferences</CardTitle>
              <CardDescription>
                Choose your preferred AI model for the scheduling assistant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>AI Provider</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="provider" value="anthropic" defaultChecked />
                    <span>Claude (Anthropic)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="provider" value="openai" />
                    <span>GPT-4 (OpenAI)</span>
                  </label>
                </div>
              </div>
              <Button>Save Preferences</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sharing Settings</CardTitle>
              <CardDescription>
                Control what information your team can see
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Calendar Visibility</Label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="visibility" value="full" />
                    <span>Full calendar (team sees event details)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="visibility" value="free_busy" defaultChecked />
                    <span>Free/Busy only (team sees only when you&apos;re available)</span>
                  </label>
                </div>
              </div>
              <Button>Save Settings</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
