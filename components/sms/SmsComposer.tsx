'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Send, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const MAX_CHARS = 160

interface SmsComposerProps {
  tenantId: string
  recipientCount: number
  onSent: () => void
}

export function SmsComposer({ tenantId, recipientCount, onSent }: SmsComposerProps) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSend() {
    if (!message.trim() || recipientCount === 0) return
    setSending(true)

    const supabase = createClient()
    await supabase.from('sms_campaigns').insert({
      tenant_id: tenantId,
      message: message.trim(),
      sent_to_count: recipientCount,
      sent_at: new Date().toISOString(),
    })

    setSending(false)
    setSent(true)
    setMessage('')
    onSent()
    setTimeout(() => setSent(false), 3000)
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Textarea
          placeholder="Skriv din SMS-besked her..."
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, MAX_CHARS))}
          rows={5}
          className="resize-none rounded-2xl border-slate-200 focus:border-[#cc5533] focus:ring-[#cc5533]/20 text-sm"
        />
        <span className="absolute bottom-3 right-4 text-xs text-slate-400 font-mono">
          {message.length}/{MAX_CHARS}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
          <Users size={15} />
          <span>{recipientCount} modtagere</span>
        </div>
        <Button
          onClick={handleSend}
          disabled={sending || !message.trim() || recipientCount === 0}
          className="rounded-full px-6 bg-[#cc5533] hover:bg-[#b34929] text-white font-bold gap-2"
        >
          {sent ? '✓ Sendt!' : sending ? 'Sender...' : (
            <>
              <Send size={14} />
              Send SMS
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
