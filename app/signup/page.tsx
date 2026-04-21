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
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding`,
        data: { full_name: fullName }
      }
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
          Your build begins now.
        </h1>
        <p style={{ color: '#64748B' }}>
          We sent a link to<br />
          <span style={{ color: '#F1F5F9' }}>{email}</span>
        </p>
        <p className="text-sm" style={{ color: '#64748B' }}>
          Click it to activate your account and start your build.
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
            Begin your build.
          </h1>
          <p style={{ color: '#64748B' }}>
            Create your account to get started.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: '#64748B' }}>
              Your name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="First name is fine"
              className="w-full px-4 py-4 rounded-2xl text-base outline-none border"
              style={{
                backgroundColor: '#1B1F3B',
                borderColor: '#2D3158',
                color: '#F1F5F9',
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: '#64748B' }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSignup()}
              placeholder="you@example.com"
              className="w-full px-4 py-4 rounded-2xl text-base outline-none border"
              style={{
                backgroundColor: '#1B1F3B',
                borderColor: '#2D3158',
                color: '#F1F5F9',
              }}
            />
          </div>

          <button
            onClick={handleSignup}
            disabled={loading || !email || !fullName}
            className="w-full py-4 px-6 rounded-2xl font-bold text-base
              tracking-wide transition-all active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: '#7C3AED', color: '#F1F5F9' }}>
            {loading ? 'Creating...' : 'Create My Account →'}
          </button>
        </div>

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