'use client'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type State = 'loading' | 'needs_auth' | 'accepting' | 'done' | 'error'

export default function JoinPage() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token')
  const [state, setState] = useState<State>('loading')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const init = async () => {
      if (!token) { setState('error'); return }

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setState('needs_auth')
        return
      }

      // User is logged in — accept immediately
      setState('accepting')
      const res = await fetch('/api/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      const data = await res.json()
      if (data.success) {
        setState('done')
        setTimeout(() => router.push('/dashboard'), 2000)
      } else {
        setErrorMsg(data.error || 'Something went wrong')
        setState('error')
      }
    }
    init()
  }, [token, router])

  const handleSendLink = async () => {
    if (!email) return
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/join?token=${token}`,
      },
    })
    if (!error) setSent(true)
  }

  if (state === 'loading') return (
    <main className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#0F1117' }}>
      <p style={{ color: '#64748B' }}>Checking your invite...</p>
    </main>
  )

  if (state === 'accepting') return (
    <main className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#0F1117' }}>
      <p style={{ color: '#64748B' }}>Accepting your seat...</p>
    </main>
  )

  if (state === 'done') return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: '#0F1117' }}>
      <div className="max-w-md w-full text-center space-y-6">
        <p className="text-xs tracking-[0.3em] uppercase"
          style={{ color: '#7C3AED' }}>STATOSPHERE</p>
        <h1 className="text-3xl font-black" style={{ color: '#F1F5F9' }}>
          You're on the Council.
        </h1>
        <p style={{ color: '#64748B' }}>
          Heading to your dashboard...
        </p>
      </div>
    </main>
  )

  if (state === 'error') return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: '#0F1117' }}>
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-3xl font-black" style={{ color: '#F1F5F9' }}>
          Something went wrong.
        </h1>
        <p style={{ color: '#64748B' }}>{errorMsg || 'This invite may be invalid or expired.'}</p>
      </div>
    </main>
  )

  // needs_auth state
  if (sent) return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: '#0F1117' }}>
      <div className="max-w-md w-full text-center space-y-6">
        <p className="text-xs tracking-[0.3em] uppercase"
          style={{ color: '#7C3AED' }}>STATOSPHERE</p>
        <h1 className="text-3xl font-black" style={{ color: '#F1F5F9' }}>
          Check your email.
        </h1>
        <p style={{ color: '#64748B' }}>
          Click the link we sent to<br />
          <span style={{ color: '#F1F5F9' }}>{email}</span><br />
          to accept your Council seat.
        </p>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: '#0F1117' }}>
      <div className="max-w-md w-full space-y-8">
        <div className="space-y-3">
          <p className="text-xs tracking-[0.3em] uppercase"
            style={{ color: '#7C3AED' }}>STATOSPHERE</p>
          <h1 className="text-3xl font-black" style={{ color: '#F1F5F9' }}>
            You've been invited<br />to a Council.
          </h1>
          <p style={{ color: '#64748B' }}>
            Enter your email to accept your seat.
            Takes 30 seconds.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium"
              style={{ color: '#64748B' }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendLink()}
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
            onClick={handleSendLink}
            disabled={!email}
            className="w-full py-4 px-6 rounded-2xl font-bold text-base
              tracking-wide transition-all active:scale-95 disabled:opacity-40"
            style={{ backgroundColor: '#7C3AED', color: '#F1F5F9' }}>
            Accept My Seat →
          </button>
        </div>
      </div>
    </main>
  )
}