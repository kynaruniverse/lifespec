import Link from 'next/link'

export default function ProfileNotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: '#0F1117' }}>
      <div className="max-w-md w-full text-center space-y-6">
        <p className="text-xs tracking-[0.3em] uppercase"
          style={{ color: '#7C3AED' }}>
          STATOSPHERE
        </p>
        <h1 className="text-3xl font-black" style={{ color: '#F1F5F9' }}>
          Build not found.
        </h1>
        <p style={{ color: '#64748B' }}>
          This profile doesn't exist or has been set to private.
        </p>
        <Link href="/"
          className="inline-block px-6 py-3 rounded-xl font-bold text-sm"
          style={{ backgroundColor: '#7C3AED', color: '#F1F5F9' }}>
          Back to Statosphere
        </Link>
      </div>
    </main>
  )
}