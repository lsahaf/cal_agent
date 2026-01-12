'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/header'
import { CreateTeamDialog } from '@/components/team/create-team-dialog'
import { InviteMemberDialog } from '@/components/team/invite-member-dialog'
import { MemberList } from '@/components/team/member-list'
import { SharingSettings } from '@/components/team/sharing-settings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, ChevronRight, Mail, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Team {
  id: string
  name: string
  slug: string
  owner_id: string
  membership: {
    id: string
    role: 'owner' | 'admin' | 'member'
    joined_at: string
  }
  member_count: number
}

interface Member {
  id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  joined_at: string
  profile: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
  }
  sharing: Array<{
    visibility_level: string
    share_event_titles: boolean
    share_event_locations: boolean
  }>
}

interface Invite {
  id: string
  email: string
  role: string
  created_at: string
  expires_at: string
}

export default function TeamPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    loadUser()
    loadTeams()
  }, [])

  useEffect(() => {
    if (selectedTeam) {
      loadMembers(selectedTeam.id)
      loadInvites(selectedTeam.id)
    }
  }, [selectedTeam])

  const loadUser = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUserId(user.id)
    }
  }

  const loadTeams = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/teams')
      const data = await res.json()
      setTeams(data.teams || [])
      if (data.teams?.length > 0 && !selectedTeam) {
        setSelectedTeam(data.teams[0])
      }
    } catch (error) {
      console.error('Failed to load teams:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMembers = async (teamId: string) => {
    try {
      const res = await fetch(`/api/teams/members?teamId=${teamId}`)
      const data = await res.json()
      setMembers(data.members || [])
    } catch (error) {
      console.error('Failed to load members:', error)
    }
  }

  const loadInvites = async (teamId: string) => {
    try {
      const res = await fetch(`/api/teams/invites?teamId=${teamId}`)
      const data = await res.json()
      setInvites(data.invites || [])
    } catch (error) {
      console.error('Failed to load invites:', error)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    const member = members.find((m) => m.id === memberId)
    const isSelf = member?.user_id === currentUserId
    const message = isSelf
      ? 'Are you sure you want to leave this team?'
      : 'Are you sure you want to remove this member?'

    if (!confirm(message)) return

    try {
      await fetch(`/api/teams/members?teamId=${selectedTeam?.id}&memberId=${memberId}`, {
        method: 'DELETE',
      })

      if (isSelf) {
        setSelectedTeam(null)
        loadTeams()
      } else {
        loadMembers(selectedTeam!.id)
      }
    } catch (error) {
      console.error('Failed to remove member:', error)
    }
  }

  const handleCancelInvite = async (inviteId: string) => {
    if (!confirm('Cancel this invite?')) return

    try {
      await fetch(`/api/teams/invites?id=${inviteId}`, {
        method: 'DELETE',
      })
      loadInvites(selectedTeam!.id)
    } catch (error) {
      console.error('Failed to cancel invite:', error)
    }
  }

  const handleDeleteTeam = async () => {
    if (!selectedTeam) return
    if (!confirm(`Are you sure you want to delete "${selectedTeam.name}"? This cannot be undone.`)) return

    try {
      await fetch(`/api/teams?id=${selectedTeam.id}`, {
        method: 'DELETE',
      })
      setSelectedTeam(null)
      loadTeams()
    } catch (error) {
      console.error('Failed to delete team:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <Header title="Team" />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <Header title="Team" />
      <div className="flex flex-1 overflow-hidden">
        {/* Team List Sidebar */}
        <div className="w-72 border-r p-4 overflow-auto">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Your Teams</h2>
            <CreateTeamDialog onCreated={loadTeams} />
          </div>

          {teams.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              <Users className="mx-auto h-8 w-8 mb-2" />
              <p>No teams yet</p>
              <p className="text-xs mt-1">Create a team to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => setSelectedTeam(team)}
                  className={`w-full flex items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                    selectedTeam?.id === team.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-accent'
                  }`}
                >
                  <div>
                    <div className="font-medium">{team.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {team.member_count} member{team.member_count !== 1 ? 's' : ''} • {team.membership.role}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Team Details */}
        <div className="flex-1 overflow-auto p-6">
          {!selectedTeam ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Select a team or create a new one
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6">
              {/* Team Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{selectedTeam.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    You are {selectedTeam.membership.role === 'owner' ? 'the owner' : `a ${selectedTeam.membership.role}`}
                  </p>
                </div>
                {['owner', 'admin'].includes(selectedTeam.membership.role) && (
                  <InviteMemberDialog
                    teamId={selectedTeam.id}
                    onInvited={() => loadInvites(selectedTeam.id)}
                  />
                )}
              </div>

              {/* Members */}
              <Card>
                <CardHeader>
                  <CardTitle>Members</CardTitle>
                  <CardDescription>
                    People who can see your availability based on your sharing settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {currentUserId && (
                    <MemberList
                      members={members}
                      currentUserId={currentUserId}
                      currentUserRole={selectedTeam.membership.role}
                      onRemove={handleRemoveMember}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Pending Invites */}
              {['owner', 'admin'].includes(selectedTeam.membership.role) && invites.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Invites</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {invites.map((invite) => (
                        <div
                          key={invite.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{invite.email}</div>
                              <div className="text-xs text-muted-foreground">
                                Invited as {invite.role}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCancelInvite(invite.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Sharing Settings */}
              <SharingSettings teamId={selectedTeam.id} />

              {/* Danger Zone */}
              {selectedTeam.membership.role === 'owner' && (
                <Card className="border-destructive/50">
                  <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button variant="destructive" onClick={handleDeleteTeam}>
                      Delete Team
                    </Button>
                    <p className="mt-2 text-xs text-muted-foreground">
                      This will permanently delete the team and remove all members.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
