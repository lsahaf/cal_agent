'use client'

import { Bell, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  title: string
  onSync?: () => void
  syncing?: boolean
}

export function Header({ title, onSync, syncing }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <h1 className="text-xl font-semibold">{title}</h1>
      <div className="flex items-center gap-2">
        {onSync && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSync}
            disabled={syncing}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', syncing && 'animate-spin')} />
            {syncing ? 'Syncing...' : 'Sync'}
          </Button>
        )}
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
