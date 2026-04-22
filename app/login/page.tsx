'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email) return
    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (!error) setSent(true)
    setLoading(false)
  }

  if (sent) return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: '#0F1117' }}>
      <div className="max-w-md w-full text-center space-y-6">
        <p className="text-xs tracking-[0.3em] uppercase" style={{ color: '#7C3AED' }}>
          CHECK YOUR EMAIL
        </p>
        <h1 className="text-3xl font-black" style={{ color: '#F1F5F9' }}>
          Magic link sent.
        </h1>
        <p style={{ color: '#64748B' }}>
          Open the link we sent to<br />
          <span style={{ color: '#F1F5F9' }}>{email}</span>
        </p>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: '#0F1117' }}>
      <div className="max-w-md w-full space-y-8">

        <div className="space-y-2">
          <p className="text-xs tracking-[0.3em] uppercase" style={{ color: '#7C3AED' }}>
            STATOSPHERE
          </p>
          <h1 className="text-3xl font-black" style={{ color: '#F1F5F9' }}>
            Welcome back.
          </h1>
        </div>

        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          placeholder="you@example.com"
          className="w-full px-4 py-4 rounded-2xl border outline-none"
          style={{
            backgroundColor: '#1B1F3B',
            borderColor: '#2D3158',
            color: '#F1F5F9',
          }}
        />

        <button
          onClick={handleLogin}
          disabled={loading || !email}
          className="w-full py-4 rounded-2xl font-bold transition-all disabled:opacity-50"
          style={{ backgroundColor: '#7C3AED', color: '#F1F5F9' }}>
          {loading ? 'Sending...' : 'Send Magic Link →'}
        </button>

        <p className="text-center text-sm" style={{ color: '#64748B' }}>
          No account?{' '}
          <Link href="/signup" style={{ color: '#A3E635' }}>
            Create one
          </Link>
        </p>

      </div>
    </main>
  )
}