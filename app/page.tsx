import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: '#0F1117' }}>

      <div className="max-w-md w-full text-center space-y-8">

        {/* Logo */}
        <div className="space-y-2">
          <p className="text-xs tracking-[0.3em] uppercase"
            style={{ color: '#7C3AED' }}>
            STATOSPHERE
          </p>
          <h1 className="text-4xl font-black tracking-tight"
            style={{ color: '#F1F5F9' }}>
            Don't just track<br />your life.
          </h1>
          <h1 className="text-4xl font-black tracking-tight"
            style={{ color: '#A3E635' }}>
            Build it.
          </h1>
        </div>

        {/* Subtext */}
        <p className="text-base leading-relaxed"
          style={{ color: '#64748B' }}>
          Your personal growth, structured by people who know you.
        </p>

        {/* CTA Buttons */}
        <div className="space-y-3 pt-4">
          <Link href="/signup" className="block w-full py-4 px-6 rounded-2xl
            text-center font-bold text-base tracking-wide transition-all
            active:scale-95"
            style={{ backgroundColor: '#7C3AED', color: '#F1F5F9' }}>
            Begin Your Build →
          </Link>
          <Link href="/login" className="block w-full py-4 px-6 rounded-2xl
            text-center font-bold text-base tracking-wide transition-all
            active:scale-95 border"
            style={{ borderColor: '#1B1F3B', color: '#64748B' }}>
            I already have an account
          </Link>
        </div>

      </div>
    </main>
  )
}