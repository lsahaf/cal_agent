'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, CheckCircle, XCircle } from 'lucide-react'

function InviteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [invite, setInvite] = useState<{
    email: string
    role: string
    team: { id: string; name: string }
  } | null>(null)

  useEffect(() => {
    if (token) {
      loadInvite()
    } else {
      setError('Invalid invite link')
      setLoading(false)
    }
  }, [token])

  const loadInvite = async () => {
    try {
      const res = await fetch(`/api/teams/invites/accept?token=${token}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Invalid invite')
      }
      const data = await res.json()
      setInvite(data.invite)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid invite')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    setAccepting(true)
    setError(null)

    try {
      const res = await fetch('/api/teams/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to accept invite')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/team')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invite')
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              Loading invite...
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !invite) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="mx-auto h-12 w-12 text-destructive" />
            <CardTitle>Invalid Invite</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button onClick={() => router.push('/team')}>
              Go to Teams
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <CardTitle>You&apos;re in!</CardTitle>
            <CardDescription>
              You&apos;ve joined {invite?.team.name}. Redirecting...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Users className="mx-auto h-12 w-12 text-primary" />
          <CardTitle>Team Invitation</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join a team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="rounded-lg border p-4 text-center">
            <div className="text-lg font-semibold">{invite?.team.name}</div>
            <div className="text-sm text-muted-foreground">
              as {invite?.role}
            </div>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            By joining, team members will be able to see your availability
            based on your sharing settings.
          </p>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push('/team')}
          >
            Decline
          </Button>
          <Button
            className="flex-1"
            onClick={handleAccept}
            disabled={accepting}
          >
            {accepting ? 'Joining...' : 'Accept Invite'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              Loading...
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <InviteContent />
    </Suspense>
  )
}
