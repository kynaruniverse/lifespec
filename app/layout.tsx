import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'Statosphere',
    template: '%s — Statosphere',
  },
  description: 'Your personal growth, structured by people who know you.',
  keywords: [
    'personal development',
    'accountability',
    'self improvement',
    'habit tracking',
    'council',
    'growth',
  ],
  authors: [{ name: 'Statosphere' }],
  creator: 'Statosphere',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: 'Statosphere',
    title: 'Statosphere',
    description: 'Your personal growth, structured by people who know you.',
  },
  twitter: {
    card: 'summary',
    title: 'Statosphere',
    description: 'Your personal growth, structured by people who know you.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0F1117',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        className="font-sans"
        style={{
          backgroundColor: '#0F1117',
          color: '#F1F5F9',
        }}
      >
        {children}
      </body>
    </html>
  )
}