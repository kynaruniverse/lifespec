import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Statosphere',
  description: 'Your personal growth, structured by people who know you.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: '#0F1117', color: '#F1F5F9' }}>
        {children}
      </body>
    </html>
  )
}