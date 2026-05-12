'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, Building2, Mail, Tag } from 'lucide-react'
import type { EmailOutput } from '@/types'
import { Badge } from '@/components/ui/Badge'

interface EmailCardProps {
  email: EmailOutput
}

export default function EmailCard({ email }: EmailCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const text = `Subject: ${email.subject}\n\n${email.body}`
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="surface-card p-5 space-y-4 transition-all duration-200 hover:border-white/[0.10]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0 mt-0.5">
            <Building2 className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="min-w-0">
            <h3 className="text-zinc-100 font-semibold text-sm leading-tight">{email.company}</h3>
            {email.to && (
              <p className="text-zinc-600 text-xs mt-0.5 flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {email.to}
              </p>
            )}
          </div>
        </div>

        <motion.button
          onClick={handleCopy}
          whileTap={{ scale: 0.95 }}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
            copied
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-white/[0.05] text-zinc-500 border border-white/[0.08] hover:text-zinc-300 hover:bg-white/[0.08] hover:border-white/[0.12]'
          }`}
          aria-label={copied ? 'Copied to clipboard' : 'Copy email to clipboard'}
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </motion.button>
      </div>

      {/* Subject */}
      <div className="space-y-1">
        <p className="text-zinc-600 text-[11px] uppercase tracking-widest font-medium">Subject</p>
        <p className="text-zinc-200 text-sm font-medium leading-snug">{email.subject}</p>
      </div>

      {/* Body */}
      <div className="space-y-1.5">
        <p className="text-zinc-600 text-[11px] uppercase tracking-widest font-medium">Body</p>
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3">
          <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">{email.body}</p>
        </div>
      </div>

      {/* Personalization hooks */}
      {email.personalization_hooks && email.personalization_hooks.length > 0 && (
        <div className="space-y-2">
          <p className="text-zinc-600 text-[11px] uppercase tracking-widest font-medium flex items-center gap-1">
            <Tag className="w-3 h-3" />
            Personalization hooks
          </p>
          <div className="flex flex-wrap gap-1.5">
            {email.personalization_hooks.map((hook, i) => (
              <Badge key={i} variant="outline">{hook}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
