import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: '#0F1117' }}>
      <div className="max-w-md w-full text-center space-y-6">
        <p className="text-xs tracking-[0.3em] uppercase"
          style={{ color: '#7C3AED' }}>
          STATOSPHERE
        </p>
        <h1 className="text-6xl font-black font-mono"
          style={{ color: '#1B1F3B' }}>
          404
        </h1>
        <h2 className="text-2xl font-black" style={{ color: '#F1F5F9' }}>
          Page not found.
        </h2>
        <p style={{ color: '#64748B' }}>
          This page doesn't exist or was moved.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 rounded-xl font-bold text-sm
            transition-all active:scale-95"
          style={{ backgroundColor: '#7C3AED', color: '#F1F5F9' }}>
          Back to Statosphere
        </Link>
      </div>
    </main>
  )
}