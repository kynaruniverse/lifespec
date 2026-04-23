'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Screen = 'hero' | 'enter_email' | 'enter_code' | 'loading'

const STATS = [
  { name: 'Discipline', icon: '⚔️', value: 74, color: '#7C3AED' },
  { name: 'Strength',   icon: '💪', value: 61, color: '#A3E635' },
  { name: 'Charisma',   icon: '✨', value: 88, color: '#7C3AED' },
  { name: 'Resilience', icon: '🛡️', value: 53, color: '#A3E635' },
]

export default function HomePage() {
  const router = useRouter()
  const [screen, setScreen]     = useState<Screen>('loading')
  const [email, setEmail]       = useState('')
  const [code, setCode]         = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState('')
  const [codeInputs, setCodeInputs] = useState(['', '', '', '', '', ''])

  // Smart redirect — already logged in? Go to dashboard
  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        router.replace('/dashboard')
      } else {
        setScreen('hero')
      }
    }
    check()
  }, [router])

  const handleSendCode = async () => {
    if (!email.trim()) return
    setSubmitting(true)
    setError('')

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    })

    if (otpError) {
      setError(otpError.message)
      setSubmitting(false)
      return
    }

    setSubmitting(false)
    setScreen('enter_code')
  }

  const handleVerifyCode = async () => {
    const fullCode = codeInputs.join('')
    if (fullCode.length !== 6) return
    setSubmitting(true)
    setError('')

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: fullCode,
      type: 'email',
    })

    if (verifyError) {
      setError('Incorrect code. Please try again.')
      setSubmitting(false)
      return
    }

    // Check if new user needs onboarding
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', data.user.id)
        .single()

      router.replace(profile?.onboarding_complete ? '/dashboard' : '/onboarding')
    }
  }

  const handleCodeInput = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1)
    const next = [...codeInputs]
    next[index] = digit
    setCodeInputs(next)
    setError('')

    if (digit && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`)
      nextInput?.focus()
    }
    if (next.every(d => d !== '') && digit) {
      // Auto-submit when all 6 filled
      setTimeout(() => {
        const btn = document.getElementById('verify-btn')
        btn?.click()
      }, 80)
    }
  }

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !codeInputs[index] && index > 0) {
      const prev = document.getElementById(`code-${index - 1}`)
      prev?.focus()
    }
  }

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next = ['', '', '', '', '', '']
    pasted.split('').forEach((d, i) => { next[i] = d })
    setCodeInputs(next)
    if (pasted.length === 6) {
      setTimeout(() => {
        const btn = document.getElementById('verify-btn')
        btn?.click()
      }, 80)
    }
  }

  if (screen === 'loading') {
    return (
      <main style={{ minHeight: '100svh', background: '#080A0F', display: 'flex',
        alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '2px solid #2D3158',
          borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </main>
    )
  }

  return (
    <main style={{
      minHeight: '100svh',
      background: '#080A0F',
      color: '#F1F5F9',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      overflowX: 'hidden',
      position: 'relative',
    }}>

      {/* ── Ambient background glow ── */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `
          radial-gradient(ellipse 60% 50% at 15% 20%, rgba(124,58,237,0.12) 0%, transparent 70%),
          radial-gradient(ellipse 40% 40% at 85% 75%, rgba(163,230,53,0.06) 0%, transparent 70%)
        `,
      }} />

      {/* ── Subtle grid texture ── */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.025,
        backgroundImage: `
          linear-gradient(rgba(163,230,53,0.6) 1px, transparent 1px),
          linear-gradient(90deg, rgba(163,230,53,0.6) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 420,
        margin: '0 auto', padding: '0 24px', paddingTop: 'env(safe-area-inset-top)' }}>

        {/* ── TOP NAV ── */}
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: 24, paddingBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'linear-gradient(135deg, #7C3AED, #A3E635)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 900,
            }}>S</div>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: '#64748B' }}>
              Statosphere
            </span>
          </div>
          {screen === 'hero' && (
            <button
              onClick={() => setScreen('enter_email')}
              style={{ fontSize: 13, fontWeight: 600, color: '#64748B',
                background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0' }}>
              Sign in →
            </button>
          )}
        </nav>

        {/* ══════════════════════════════════════
            SCREEN: HERO
        ══════════════════════════════════════ */}
        {screen === 'hero' && (
          <div style={{ paddingTop: 48, paddingBottom: 48 }}>

            {/* Eyebrow */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%',
                background: '#A3E635', boxShadow: '0 0 8px #A3E635' }} />
              <span style={{ fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase',
                color: '#64748B', fontWeight: 600 }}>
                Now in early access
              </span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontSize: 'clamp(40px, 11vw, 52px)',
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              margin: '0 0 20px',
              color: '#F1F5F9',
            }}>
              Your life.<br />
              <span style={{
                background: 'linear-gradient(90deg, #A3E635 0%, #7DF4B0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Levelled up.
              </span>
            </h1>

            <p style={{ fontSize: 16, lineHeight: 1.65, color: '#64748B',
              margin: '0 0 36px', maxWidth: 340 }}>
              Pick the stats that matter. Let a small group of trusted people assign
              you real challenges — and hold you to them.
            </p>

            {/* Live stat preview card */}
            <div style={{
              background: 'rgba(27,31,59,0.6)',
              border: '1px solid rgba(45,49,88,0.8)',
              borderRadius: 20,
              padding: '20px 20px 16px',
              marginBottom: 32,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
                    color: '#64748B', margin: 0 }}>Your Build</p>
                  <p style={{ fontSize: 15, fontWeight: 800, color: '#F1F5F9',
                    margin: '2px 0 0', fontFamily: 'monospace' }}>@yourname</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
                    color: '#64748B', margin: 0 }}>Council</p>
                  <p style={{ fontSize: 15, fontWeight: 800, color: '#A3E635',
                    margin: '2px 0 0', fontFamily: 'monospace' }}>3 / 5</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {STATS.map((stat, i) => (
                  <div key={stat.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: 5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13 }}>{stat.icon}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#CBD5E1' }}>
                          {stat.name}
                        </span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace',
                        color: '#A3E635' }}>
                        {stat.value}
                      </span>
                    </div>
                    <div style={{ height: 4, background: '#0F1117', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${stat.value}%`,
                        background: i % 2 === 0
                          ? 'linear-gradient(90deg, #7C3AED, #A855F7)'
                          : 'linear-gradient(90deg, #65A30D, #A3E635)',
                        borderRadius: 4,
                        animation: `growBar${i} 1.2s ease-out ${i * 0.15}s both`,
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => setScreen('enter_email')}
              style={{
                width: '100%', padding: '18px 24px',
                background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                color: '#F1F5F9', border: 'none', borderRadius: 16,
                fontSize: 16, fontWeight: 800, letterSpacing: '0.02em',
                cursor: 'pointer',
                boxShadow: '0 8px 32px rgba(124,58,237,0.35)',
                marginBottom: 12,
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseDown={e => {
                const el = e.currentTarget
                el.style.transform = 'scale(0.97)'
                el.style.boxShadow = '0 4px 16px rgba(124,58,237,0.25)'
              }}
              onMouseUp={e => {
                const el = e.currentTarget
                el.style.transform = 'scale(1)'
                el.style.boxShadow = '0 8px 32px rgba(124,58,237,0.35)'
              }}>
              Begin Your Build →
            </button>

            <p style={{ fontSize: 12, textAlign: 'center', color: '#3D4466', margin: 0 }}>
              No password. No app download. Just your email.
            </p>

            {/* Feature pills */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap',
              marginTop: 32, justifyContent: 'center' }}>
              {['Weekly challenges', 'Council reviews', 'Stat tracking', 'Streak system'].map(f => (
                <span key={f} style={{
                  fontSize: 11, fontWeight: 600, padding: '5px 10px',
                  borderRadius: 20, border: '1px solid #2D3158',
                  color: '#64748B', background: 'rgba(27,31,59,0.4)',
                }}>
                  {f}
                </span>
              ))}
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════
            SCREEN: ENTER EMAIL
        ══════════════════════════════════════ */}
        {screen === 'enter_email' && (
          <div style={{ paddingTop: 48, paddingBottom: 48 }}>

            <button
              onClick={() => { setScreen('hero'); setError(''); setEmail('') }}
              style={{ background: 'none', border: 'none', cursor: 'pointer',
                color: '#64748B', fontSize: 13, padding: '0 0 32px',
                display: 'flex', alignItems: 'center', gap: 6 }}>
              ← Back
            </button>

            <h2 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.03em',
              margin: '0 0 8px', lineHeight: 1.1, color: '#F1F5F9' }}>
              Enter your<br />
              <span style={{ color: '#A3E635' }}>email.</span>
            </h2>
            <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 36px',
              lineHeight: 1.6 }}>
              We'll send a 6-digit code. No password, no magic links,
              no new tabs.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="email"
                value={email}
                autoFocus
                onChange={e => { setEmail(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleSendCode()}
                placeholder="you@example.com"
                autoComplete="email"
                style={{
                  width: '100%', padding: '16px 18px',
                  background: 'rgba(27,31,59,0.8)',
                  border: `1px solid ${error ? '#EF4444' : '#2D3158'}`,
                  borderRadius: 14, color: '#F1F5F9', fontSize: 16,
                  outline: 'none', boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#7C3AED' }}
                onBlur={e => { e.currentTarget.style.borderColor = error ? '#EF4444' : '#2D3158' }}
              />

              {error && (
                <p style={{ fontSize: 13, color: '#EF4444', margin: 0,
                  padding: '10px 14px', background: 'rgba(239,68,68,0.08)',
                  borderRadius: 10, border: '1px solid rgba(239,68,68,0.2)' }}>
                  {error}
                </p>
              )}

              <button
                onClick={handleSendCode}
                disabled={submitting || !email.trim()}
                style={{
                  width: '100%', padding: '16px 24px',
                  background: submitting || !email.trim()
                    ? 'rgba(124,58,237,0.3)'
                    : 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                  color: '#F1F5F9', border: 'none', borderRadius: 14,
                  fontSize: 15, fontWeight: 700, cursor: submitting || !email.trim()
                    ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: submitting || !email.trim()
                    ? 'none' : '0 6px 24px rgba(124,58,237,0.3)',
                }}>
                {submitting ? 'Sending code...' : 'Send Code →'}
              </button>
            </div>

            <p style={{ fontSize: 12, color: '#3D4466', textAlign: 'center',
              marginTop: 24, lineHeight: 1.6 }}>
              New here? We'll create your account automatically.
            </p>

          </div>
        )}

        {/* ══════════════════════════════════════
            SCREEN: ENTER CODE
        ══════════════════════════════════════ */}
        {screen === 'enter_code' && (
          <div style={{ paddingTop: 48, paddingBottom: 48 }}>

            <button
              onClick={() => { setScreen('enter_email'); setError(''); setCodeInputs(['','','','','','']) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer',
                color: '#64748B', fontSize: 13, padding: '0 0 32px',
                display: 'flex', alignItems: 'center', gap: 6 }}>
              ← Back
            </button>

            <div style={{ marginBottom: 32 }}>
              <p style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
                color: '#7C3AED', margin: '0 0 8px', fontWeight: 700 }}>
                Code sent
              </p>
              <h2 style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-0.03em',
                margin: '0 0 8px', lineHeight: 1.1, color: '#F1F5F9' }}>
                Check your<br />
                <span style={{ color: '#A3E635' }}>inbox.</span>
              </h2>
              <p style={{ fontSize: 14, color: '#64748B', margin: 0, lineHeight: 1.6 }}>
                We sent a 6-digit code to<br />
                <span style={{ color: '#F1F5F9', fontWeight: 600 }}>{email}</span>
              </p>
            </div>

            {/* 6-digit code inputs */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, justifyContent: 'center' }}
              onPaste={handleCodePaste}>
              {codeInputs.map((digit, i) => (
                <input
                  key={i}
                  id={`code-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  autoFocus={i === 0}
                  onChange={e => handleCodeInput(i, e.target.value)}
                  onKeyDown={e => handleCodeKeyDown(i, e)}
                  style={{
                    width: 48, height: 60,
                    textAlign: 'center',
                    fontSize: 24, fontWeight: 800,
                    fontFamily: 'monospace',
                    background: digit ? 'rgba(124,58,237,0.15)' : 'rgba(27,31,59,0.8)',
                    border: `2px solid ${error ? '#EF4444' : digit ? '#7C3AED' : '#2D3158'}`,
                    borderRadius: 12,
                    color: '#F1F5F9',
                    outline: 'none',
                    caretColor: '#7C3AED',
                    transition: 'all 0.15s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => {
                    if (!error) e.currentTarget.style.borderColor = '#7C3AED'
                  }}
                  onBlur={e => {
                    if (!error && !e.currentTarget.value)
                      e.currentTarget.style.borderColor = '#2D3158'
                  }}
                />
              ))}
            </div>

            {error && (
              <p style={{ fontSize: 13, color: '#EF4444', margin: '0 0 12px',
                padding: '10px 14px', background: 'rgba(239,68,68,0.08)',
                borderRadius: 10, border: '1px solid rgba(239,68,68,0.2)',
                textAlign: 'center' }}>
                {error}
              </p>
            )}

            <button
              id="verify-btn"
              onClick={handleVerifyCode}
              disabled={submitting || codeInputs.join('').length < 6}
              style={{
                width: '100%', padding: '16px 24px',
                background: submitting || codeInputs.join('').length < 6
                  ? 'rgba(163,230,53,0.2)'
                  : 'linear-gradient(135deg, #84CC16 0%, #A3E635 100%)',
                color: submitting || codeInputs.join('').length < 6 ? '#4B5563' : '#0F1117',
                border: 'none', borderRadius: 14,
                fontSize: 15, fontWeight: 800,
                cursor: submitting || codeInputs.join('').length < 6
                  ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: codeInputs.join('').length < 6
                  ? 'none' : '0 6px 24px rgba(163,230,53,0.25)',
              }}>
              {submitting ? 'Verifying...' : 'Enter Statosphere →'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <button
                onClick={() => { setCodeInputs(['','','','','','']); handleSendCode() }}
                style={{ background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 13, color: '#64748B', textDecoration: 'underline',
                  textDecorationColor: 'transparent',
                  transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#94A3B8'}
                onMouseLeave={e => e.currentTarget.style.color = '#64748B'}>
                Didn't get it? Resend code
              </button>
            </div>

          </div>
        )}

      </div>

      {/* Bar grow animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');

        @keyframes growBar0 { from { width: 0 } to { width: 74% } }
        @keyframes growBar1 { from { width: 0 } to { width: 61% } }
        @keyframes growBar2 { from { width: 0 } to { width: 88% } }
        @keyframes growBar3 { from { width: 0 } to { width: 53% } }

        * { -webkit-tap-highlight-color: transparent; }

        input:-webkit-autofill,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #1B1F3B inset;
          -webkit-text-fill-color: #F1F5F9;
        }
      `}</style>

    </main>
  )
}
