'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSignup = async () => {
    if (!email || !fullName) return
    setLoading(true)

    // Store temporary onboarding info in localStorage
    localStorage.setItem(
      'statosphere_signup',
      JSON.stringify({ fullName })
    )

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
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-3xl font-black" style={{ color: '#F1F5F9' }}>
          Your build starts now.
        </h1>
        <p style={{ color: '#64748B' }}>
          Check your email to continue onboarding.
        </p>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: '#0F1117' }}>
      <div className="max-w-md w-full space-y-8">

        <h1 className="text-3xl font-black" style={{ color: '#F1F5F9' }}>
          Begin your build.
        </h1>

        <input
          type="text"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          placeholder="Your name"
          className="w-full px-4 py-4 rounded-2xl border outline-none"
          style={{
            backgroundColor: '#1B1F3B',
            borderColor: '#2D3158',
            color: '#F1F5F9',
          }}
        />

        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full px-4 py-4 rounded-2xl border outline-none"
          style={{
            backgroundColor: '#1B1F3B',
            borderColor: '#2D3158',
            color: '#F1F5F9',
          }}
        />

        <button
          onClick={handleSignup}
          disabled={loading || !email || !fullName}
          className="w-full py-4 rounded-2xl font-bold disabled:opacity-50"
          style={{ backgroundColor: '#7C3AED', color: '#F1F5F9' }}>
          {loading ? 'Creating...' : 'Continue →'}
        </button>

        <p className="text-center text-sm" style={{ color: '#64748B' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#A3E635' }}>
            Sign in
          </Link>
        </p>

      </div>
    </main>
  )
}