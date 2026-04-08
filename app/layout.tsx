import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'UJRIS | Justice Intelligence - AI-Powered Legal Tools',
  description: 'Justice Shouldn\'t Require a Lawyer to Survive. UJRIS provides AI-powered legal tools for self-represented litigants facing discrimination, abuse, and institutional injustice.',
  keywords: ['legal tech', 'AI legal', 'self-represented litigant', 'employment tribunal', 'discrimination', 'PIP appeal', 'UK law'],
  generator: 'v0.app',
  openGraph: {
    title: 'UJRIS | Justice Intelligence',
    description: 'AI-Powered Legal Tools for Self-Represented Litigants',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
