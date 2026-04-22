import type { Metadata, Viewport } from 'next'
import './globals.css'

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
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0F1117',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ backgroundColor: '#0F1117', color: '#F1F5F9' }}>
        {children}
      </body>
    </html>
  )
}