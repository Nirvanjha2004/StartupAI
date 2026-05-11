'use client'

import { useState } from 'react'
import type { EmailOutput } from '@/types'

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
      // Fallback for non-secure contexts
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
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-white font-semibold text-base">{email.company}</h3>
          {email.to && (
            <p className="text-[#666] text-sm mt-0.5">To: {email.to}</p>
          )}
        </div>
        <button
          onClick={handleCopy}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            copied
              ? 'bg-[#22c55e22] text-[#22c55e] border border-[#22c55e44]'
              : 'bg-[#2a2a2a] text-[#888] hover:text-white border border-[#333] hover:border-[#444]'
          }`}
        >
          {copied ? 'Copied!' : 'Copy Email'}
        </button>
      </div>

      {/* Subject */}
      <div>
        <p className="text-[#555] text-xs uppercase tracking-wider mb-1">Subject</p>
        <p className="text-[#ccc] text-sm font-medium">{email.subject}</p>
      </div>

      {/* Body */}
      <div>
        <p className="text-[#555] text-xs uppercase tracking-wider mb-1">Body</p>
        <p className="text-[#999] text-sm leading-relaxed whitespace-pre-wrap">{email.body}</p>
      </div>

      {/* Hooks */}
      {email.personalization_hooks && email.personalization_hooks.length > 0 && (
        <div>
          <p className="text-[#555] text-xs uppercase tracking-wider mb-2">Hooks</p>
          <div className="flex flex-wrap gap-1.5">
            {email.personalization_hooks.map((hook, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-[#2a2a2a] text-[#777] text-xs rounded-full border border-[#333]"
              >
                {hook}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
