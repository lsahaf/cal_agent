'use client'

import { Button } from '@/components/ui/button'
import { Trash2, Shield, User, Crown } from 'lucide-react'

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

interface MemberListProps {
  members: Member[]
  currentUserId: string
  currentUserRole: 'owner' | 'admin' | 'member'
  onRemove: (memberId: string) => void
}

const roleIcons = {
  owner: Crown,
  admin: Shield,
  member: User,
}

const roleLabels = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
}

export function MemberList({ members, currentUserId, currentUserRole, onRemove }: MemberListProps) {
  const canRemove = (member: Member) => {
    if (member.role === 'owner') return false
    if (member.user_id === currentUserId) return true
    return ['owner', 'admin'].includes(currentUserRole)
  }

  return (
    <div className="space-y-2">
      {members.map((member) => {
        const RoleIcon = roleIcons[member.role]
        const sharingSettings = member.sharing?.[0]

        return (
          <div
            key={member.id}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                {member.profile.avatar_url ? (
                  <img
                    src={member.profile.avatar_url}
                    alt=""
                    className="h-10 w-10 rounded-full"
                  />
                ) : (
                  <span className="text-lg font-medium">
                    {(member.profile.full_name || member.profile.email)[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {member.profile.full_name || member.profile.email}
                  </span>
                  {member.user_id === currentUserId && (
                    <span className="text-xs text-muted-foreground">(you)</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RoleIcon className="h-3 w-3" />
                  <span>{roleLabels[member.role]}</span>
                  <span className="text-xs">•</span>
                  <span className="text-xs">
                    {sharingSettings?.visibility_level === 'full'
                      ? 'Full calendar'
                      : 'Free/busy only'}
                  </span>
                </div>
              </div>
            </div>
            {canRemove(member) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(member.id)}
                title={member.user_id === currentUserId ? 'Leave team' : 'Remove member'}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        )
      })}
    </div>
  )
}
