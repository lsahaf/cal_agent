'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send } from 'lucide-react'

const suggestedQuestions = [
  'When am I free tomorrow?',
  'What meetings do I have this week?',
  'Find a 30-minute slot for a team meeting',
  'When is everyone on my team available?',
]

export default function ChatPage() {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])

  const handleSend = () => {
    if (!message.trim()) return

    setMessages((prev) => [...prev, { role: 'user', content: message }])
    // TODO: Send to AI endpoint
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: 'I\'m your scheduling assistant. Once you connect your calendars, I\'ll be able to help you find availability, schedule meetings, and manage your time.',
      },
    ])
    setMessage('')
  }

  const handleSuggestion = (suggestion: string) => {
    setMessage(suggestion)
  }

  return (
    <div className="flex h-full flex-col">
      <Header title="Chat" />
      <div className="flex-1 overflow-auto p-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            <h2 className="text-xl font-semibold">How can I help you today?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ask me about your availability, schedule meetings, or get insights about your calendar.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {suggestedQuestions.map((question) => (
                <Button
                  key={question}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestion(question)}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="border-t p-4">
        <div className="mx-auto flex max-w-2xl gap-2">
          <Input
            placeholder="Ask about your schedule..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button onClick={handleSend}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
