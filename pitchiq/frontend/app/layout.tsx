import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PitchIQ — AI-Powered Cold Outreach',
  description: 'Research companies and generate personalized cold emails in seconds with multi-agent AI.',
  openGraph: {
    title: 'PitchIQ',
    description: 'AI-powered cold outreach. Research to email in seconds.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#080808] text-[#f5f5f5] antialiased">
        {children}
      </body>
    </html>
  )
}
