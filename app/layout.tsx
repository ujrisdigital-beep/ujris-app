import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, DM_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const cormorant = Cormorant_Garamond({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif"
});

const dmSans = DM_Sans({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans"
});

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
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
