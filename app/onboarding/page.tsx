'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { StatCategory } from '@/lib/types'

const STEPS = ['becoming', 'stats', 'username'] as const
type Step = typeof STEPS[number]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('becoming')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // Form state
  const [becoming, setBecoming] = useState('')
  const [selectedStats, setSelectedStats] = useState<string[]>([])
  const [username, setUsername] = useState('')
  const [allStats, setAllStats] = useState<StatCategory[]>([])
  const [usernameError, setUsernameError] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      // Check if already onboarded
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', user.id)
        .single()

      if (profile?.onboarding_complete) {
        router.push('/dashboard')
        return
      }

      // Load stats
      const { data: stats } = await supabase
        .from('stat_categories')
        .select('*')
        .order('name')
      if (stats) setAllStats(stats)
    }
    init()
  }, [router])

  const toggleStat = (id: string) => {
    setSelectedStats(prev => {
      if (prev.includes(id)) return prev.filter(s => s !== id)
      if (prev.length >= 5) return prev
      return [...prev, id]
    })
  }

  const handleComplete = async () => {
    if (!userId || !username.trim()) return
    setLoading(true)
    setUsernameError('')

    // Check username unique
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase().trim())
      .neq('id', userId)
      .single()

    if (existing) {
      setUsernameError('That username is taken. Try another.')
      setLoading(false)
      return
    }

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        username: username.toLowerCase().trim(),
        becoming_statement: becoming.trim(),
        onboarding_complete: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (profileError) {
      setLoading(false)
      return
    }

    // Insert selected stats
    if (selectedStats.length > 0) {
      const statRows = selectedStats.map(statId => ({
        user_id: userId,
        stat_category_id: statId,
        current_value: 0,
      }))
      await supabase.from('user_stats').insert(statRows)
    }

    router.push('/dashboard')
  }

  const canProceedBecoming = becoming.trim().length >= 10
  const canProceedStats = selectedStats.length >= 3
  const canProceedUsername = username.trim().length >= 3

  const stepIndex = STEPS.indexOf(step)
  const progress = ((stepIndex + 1) / STEPS.length) * 100

  return (
    <main className="min-h-screen flex flex-col px-6 py-12"
      style={{ backgroundColor: '#0F1117' }}>

      <div className="max-w-md w-full mx-auto flex flex-col flex-1 space-y-8">

        {/* Header */}
        <div className="space-y-3">
          <p className="text-xs tracking-[0.3em] uppercase"
            style={{ color: '#7C3AED' }}>
            STATOSPHERE — BUILD SETUP
          </p>

          {/* Progress bar */}
          <div className="w-full h-1 rounded-full"
            style={{ backgroundColor: '#1B1F3B' }}>
            <div
              className="h-1 rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, backgroundColor: '#7C3AED' }}
            />
          </div>
          <p className="text-xs" style={{ color: '#64748B' }}>
            Step {stepIndex + 1} of {STEPS.length}
          </p>
        </div>

        {/* STEP 1 — Becoming */}
        {step === 'becoming' && (
          <div className="flex flex-col flex-1 space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-black leading-tight"
                style={{ color: '#F1F5F9' }}>
                Who are you becoming?
              </h1>
              <p style={{ color: '#64748B' }}>
                Not who you are. Who you're building toward.
                Be honest. Be specific. This is your north star.
              </p>
            </div>

            <div className="space-y-2 flex-1">
              <p className="text-sm font-medium" style={{ color: '#64748B' }}>
                I am becoming someone who...
              </p>
              <textarea
                value={becoming}
                onChange={e => setBecoming(e.target.value)}
                placeholder="...leads with confidence, stays disciplined under pressure, and builds something real."
                rows={5}
                className="w-full px-4 py-4 rounded-2xl text-base outline-none
                  border resize-none leading-relaxed"
                style={{
                  backgroundColor: '#1B1F3B',
                  borderColor: becoming.length > 0 ? '#7C3AED' : '#2D3158',
                  color: '#F1F5F9',
                }}
              />
              <p className="text-xs text-right"
                style={{ color: becoming.length < 10 ? '#64748B' : '#A3E635' }}>
                {becoming.length} characters
                {becoming.length < 10 ? ' — keep going' : ' — good'}
              </p>
            </div>

            <button
              onClick={() => setStep('stats')}
              disabled={!canProceedBecoming}
              className="w-full py-4 px-6 rounded-2xl font-bold text-base
                tracking-wide transition-all active:scale-95 disabled:opacity-40"
              style={{ backgroundColor: '#7C3AED', color: '#F1F5F9' }}>
              Set My Direction →
            </button>
          </div>
        )}

        {/* STEP 2 — Stats */}
        {step === 'stats' && (
          <div className="flex flex-col flex-1 space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-black leading-tight"
                style={{ color: '#F1F5F9' }}>
                Choose your stats.
              </h1>
              <p style={{ color: '#64748B' }}>
                Pick 3 to 5 areas you want to actively develop.
                Your Council will assign challenges around these.
              </p>
            </div>

            {/* Selected count */}
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: '#64748B' }}>
                {selectedStats.length} of 5 selected
              </p>
              {selectedStats.length >= 3 && (
                <p className="text-sm font-medium" style={{ color: '#A3E635' }}>
                  ✓ Ready to continue
                </p>
              )}
            </div>

            {/* Stat grid */}
            <div className="grid grid-cols-2 gap-3 flex-1">
              {allStats.map(stat => {
                const isSelected = selectedStats.includes(stat.id)
                const isDisabled = !isSelected && selectedStats.length >= 5
                return (
                  <button
                    key={stat.id}
                    onClick={() => !isDisabled && toggleStat(stat.id)}
                    className="p-4 rounded-2xl text-left transition-all active:scale-95
                      border space-y-1"
                    style={{
                      backgroundColor: isSelected ? '#7C3AED' : '#1B1F3B',
                      borderColor: isSelected ? '#7C3AED' : '#2D3158',
                      opacity: isDisabled ? 0.4 : 1,
                    }}>
                    <p className="text-2xl">{stat.icon}</p>
                    <p className="font-bold text-sm"
                      style={{ color: '#F1F5F9' }}>
                      {stat.name}
                    </p>
                    <p className="text-xs leading-tight"
                      style={{ color: isSelected ? '#E2D9F3' : '#64748B' }}>
                      {stat.description}
                    </p>
                  </button>
                )
              })}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep('becoming')}
                className="py-4 px-6 rounded-2xl font-bold text-base border
                  transition-all active:scale-95"
                style={{ borderColor: '#2D3158', color: '#64748B' }}>
                ←
              </button>
              <button
                onClick={() => setStep('username')}
                disabled={!canProceedStats}
                className="flex-1 py-4 px-6 rounded-2xl font-bold text-base
                  tracking-wide transition-all active:scale-95 disabled:opacity-40"
                style={{ backgroundColor: '#7C3AED', color: '#F1F5F9' }}>
                Lock In My Build →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Username */}
        {step === 'username' && (
          <div className="flex flex-col flex-1 space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-black leading-tight"
                style={{ color: '#F1F5F9' }}>
                Choose your handle.
              </h1>
              <p style={{ color: '#64748B' }}>
                This is how your Council will see you.
                Make it yours.
              </p>
            </div>

            <div className="space-y-2 flex-1">
              <label className="text-sm font-medium"
                style={{ color: '#64748B' }}>
                Username
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold"
                  style={{ color: '#7C3AED' }}>
                  @
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={e => {
                    setUsernameError('')
                    setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())
                  }}
                  placeholder="yourname"
                  maxLength={20}
                  className="w-full pl-8 pr-4 py-4 rounded-2xl text-base
                    outline-none border font-mono"
                  style={{
                    backgroundColor: '#1B1F3B',
                    borderColor: usernameError ? '#EF4444'
                      : username.length >= 3 ? '#7C3AED' : '#2D3158',
                    color: '#F1F5F9',
                  }}
                />
              </div>
              {usernameError && (
                <p className="text-sm" style={{ color: '#EF4444' }}>
                  {usernameError}
                </p>
              )}
              <p className="text-xs" style={{ color: '#64748B' }}>
                Letters, numbers, underscores only. Max 20 characters.
              </p>
            </div>

            {/* Summary card */}
            {username.length >= 3 && (
              <div className="p-4 rounded-2xl border space-y-3"
                style={{ backgroundColor: '#1B1F3B', borderColor: '#2D3158' }}>
                <p className="text-xs tracking-widest uppercase"
                  style={{ color: '#7C3AED' }}>
                  YOUR BUILD
                </p>
                <p className="font-black text-lg"
                  style={{ color: '#F1F5F9' }}>
                  @{username}
                </p>
                <p className="text-sm leading-relaxed"
                  style={{ color: '#64748B' }}>
                  "{becoming}"
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedStats.map(statId => {
                    const stat = allStats.find(s => s.id === statId)
                    if (!stat) return null
                    return (
                      <span key={statId}
                        className="px-3 py-1 rounded-full text-xs font-bold"
                        style={{ backgroundColor: '#2D3158', color: '#A3E635' }}>
                        {stat.icon} {stat.name}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep('stats')}
                className="py-4 px-6 rounded-2xl font-bold text-base border
                  transition-all active:scale-95"
                style={{ borderColor: '#2D3158', color: '#64748B' }}>
                ←
              </button>
              <button
                onClick={handleComplete}
                disabled={loading || !canProceedUsername}
                className="flex-1 py-4 px-6 rounded-2xl font-bold text-base
                  tracking-wide transition-all active:scale-95 disabled:opacity-40"
                style={{ backgroundColor: '#A3E635', color: '#0F1117' }}>
                {loading ? 'Building...' : 'Enter Statosphere →'}
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}