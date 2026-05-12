'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

interface EmailResultProps {
  subject?: string
  body?: string
  sentiment?: string
  onCopy?: (text: string) => void
  onEdit?: (text: string) => void
}

export default function EmailResult({
  subject = 'Subject line here',
  body = 'Email body would appear here...',
  sentiment = 'positive',
  onCopy,
  onEdit,
}: EmailResultProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const fullEmail = `Subject: ${subject}\n\n${body}`
    if (onCopy) onCopy(fullEmail)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sentimentVariant =
    sentiment === 'positive' ? 'success' :
    sentiment === 'negative' ? 'error'   : 'default'

  return (
    <div className="surface-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <Badge variant={sentimentVariant}>
          {sentiment}
        </Badge>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              copied
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-white/[0.05] text-zinc-500 border border-white/[0.08] hover:text-zinc-300 hover:bg-white/[0.08]'
            }`}
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          {onEdit && (
            <button
              onClick={() => onEdit(body)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.05] text-zinc-500 border border-white/[0.08] hover:text-zinc-300 hover:bg-white/[0.08] transition-all duration-200"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Subject */}
      <div className="space-y-1">
        <p className="text-zinc-600 text-[11px] uppercase tracking-widest font-medium">Subject</p>
        <p className="text-zinc-200 text-sm font-medium">{subject}</p>
      </div>

      {/* Body */}
      <div className="space-y-1.5">
        <p className="text-zinc-600 text-[11px] uppercase tracking-widest font-medium">Body</p>
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3">
          <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">{body}</p>
        </div>
      </div>
    </div>
  )
}
