'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { getStreakFlame } from '@/lib/cycle'

type Props = {
  profile: any
  userStats: any[]
  streaks: any[]
  councilSize: number
  approvedCount: number
}

export default function PublicProfileClient({
  profile,
  userStats,
  streaks,
  councilSize,
  approvedCount,
}: Props) {
  const [viewerId, setViewerId] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [requestStatus, setRequestStatus] = useState<
    'idle' | 'sending' | 'sent' | 'already'
  >('idle')
  const [copied, setCopied] = useState(false)
  const [message, setMessage] = useState('')
  const [showRequestForm, setShowRequestForm] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setViewerId(user.id)
      setIsOwner(user.id === profile.id)

      // Check if already requested
      const { data: existing } = await supabase
        .from('council_requests')
        .select('id, status')
        .eq('requester_id', user.id)
        .eq('target_user_id', profile.id)
        .single()

      if (existing) setRequestStatus('already')
    }
    init()
  }, [profile.id])

  const handleCopyLink = () => {
    const url = `${window.location.origin}/u/${profile.username}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleRequest = async () => {
    if (!viewerId) return
    setRequestStatus('sending')

    await supabase.from('council_requests').insert({
      requester_id: viewerId,
      target_user_id: profile.id,
      message: message.trim() || null,
    })

    setRequestStatus('sent')
    setShowRequestForm(false)
  }

  const getStreakForStat = (statCategoryId: string) => {
    return streaks.find((s: any) => s.stat_category_id === statCategoryId)
  }

  const totalStatPoints = userStats.reduce(
    (sum: number, s: any) => sum + (s.current_value || 0), 0
  )

  const topStat = userStats.reduce(
    (top: any, s: any) => (!top || s.current_value > top.current_value) ? s : top,
    null
  )

  return (
    <main className="min-h-screen px-6 py-12"
      style={{ backgroundColor: '#0F1117' }}>
      <div className="max-w-md mx-auto space-y-8">

        {/* Nav */}
        <div className="flex items-center justify-between">
          <Link href="/"
            className="text-xs tracking-[0.3em] uppercase"
            style={{ color: '#7C3AED' }}>
            STATOSPHERE
          </Link>
          {isOwner && (
            <Link href="/dashboard"
              className="text-sm px-4 py-2 rounded-xl border"
              style={{ borderColor: '#2D3158', color: '#64748B' }}>
              My Dashboard
            </Link>
          )}
        </div>

        {/* Profile header */}
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-black"
                style={{ color: '#F1F5F9' }}>
                @{profile.username}
              </h1>
              {profile.full_name && (
                <p className="text-sm" style={{ color: '#64748B' }}>
                  {profile.full_name}
                </p>
              )}
            </div>

            {/* Share button */}
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 rounded-xl font-bold text-sm border
                transition-all active:scale-95"
              style={{
                borderColor: copied ? '#A3E635' : '#2D3158',
                color: copied ? '#A3E635' : '#64748B',
              }}>
              {copied ? '✓ Copied' : '↗ Share'}
            </button>
          </div>

          {/* Becoming statement */}
          {profile.becoming_statement && (
            <div className="p-4 rounded-2xl border"
              style={{ backgroundColor: '#1B1F3B', borderColor: '#2D3158' }}>
              <p className="text-xs tracking-widest uppercase mb-2"
                style={{ color: '#7C3AED' }}>
                BECOMING
              </p>
              <p className="leading-relaxed text-sm"
                style={{ color: '#F1F5F9' }}>
                "{profile.becoming_statement}"
              </p>
            </div>
          )}
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-2xl border text-center"
            style={{ backgroundColor: '#1B1F3B', borderColor: '#2D3158' }}>
            <p className="font-black text-xl font-mono"
              style={{ color: '#A3E635' }}>
              {totalStatPoints}
            </p>
            <p className="text-xs mt-1" style={{ color: '#64748B' }}>
              Total XP
            </p>
          </div>
          <div className="p-3 rounded-2xl border text-center"
            style={{ backgroundColor: '#1B1F3B', borderColor: '#2D3158' }}>
            <p className="font-black text-xl font-mono"
              style={{ color: '#A3E635' }}>
              {approvedCount}
            </p>
            <p className="text-xs mt-1" style={{ color: '#64748B' }}>
              Completed
            </p>
          </div>
          <div className="p-3 rounded-2xl border text-center"
            style={{ backgroundColor: '#1B1F3B', borderColor: '#2D3158' }}>
            <p className="font-black text-xl font-mono"
              style={{ color: '#A3E635' }}>
              {councilSize}
            </p>
            <p className="text-xs mt-1" style={{ color: '#64748B' }}>
              Council
            </p>
          </div>
        </div>

        {/* Top stat highlight */}
        {topStat && topStat.current_value > 0 && (
          <div className="p-4 rounded-2xl flex items-center gap-4"
            style={{ backgroundColor: '#7C3AED' }}>
            <span className="text-3xl">
              {topStat.stat_categories?.icon}
            </span>
            <div>
              <p className="text-xs tracking-widest uppercase"
                style={{ color: '#E2D9F3' }}>
                STRONGEST STAT
              </p>
              <p className="font-black text-lg"
                style={{ color: '#F1F5F9' }}>
                {topStat.stat_categories?.name}
              </p>
              <p className="text-xs font-mono"
                style={{ color: '#E2D9F3' }}>
                {topStat.current_value} points
              </p>
            </div>
          </div>
        )}

        {/* All stats */}
        <div className="space-y-4">
          <p className="text-xs tracking-[0.3em] uppercase"
            style={{ color: '#64748B' }}>
            BUILD STATS
          </p>
          {userStats.length === 0 ? (
            <p className="text-sm" style={{ color: '#64748B' }}>
              No stats yet. Still building.
            </p>
          ) : (
            userStats.map((stat: any) => {
              const streak = getStreakForStat(stat.stat_category_id)
              const currentStreak = streak?.current_streak || 0
              return (
                <div key={stat.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {stat.stat_categories?.icon}
                      </span>
                      <span className="font-bold text-sm"
                        style={{ color: '#F1F5F9' }}>
                        {stat.stat_categories?.name}
                      </span>
                      {currentStreak > 0 && (
                        <span className="text-xs">
                          {getStreakFlame(currentStreak)}
                          <span className="ml-1 font-mono"
                            style={{ color: '#F59E0B' }}>
                            {currentStreak}w
                          </span>
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-sm font-bold"
                      style={{ color: '#A3E635' }}>
                      {stat.current_value}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full"
                    style={{ backgroundColor: '#1B1F3B' }}>
                    <div
                      className="h-2 rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.max(stat.current_value, 2)}%`,
                        backgroundColor: '#7C3AED',
                        minWidth: stat.current_value > 0 ? '8px' : '0'
                      }}
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Council request section */}
        {!isOwner && profile.council_requests_open && (
          <div className="space-y-3">
            {requestStatus === 'sent' || requestStatus === 'already' ? (
              <div className="p-4 rounded-2xl border text-center"
                style={{ borderColor: '#2D3158' }}>
                <p className="font-bold text-sm" style={{ color: '#A3E635' }}>
                  ✓ Request sent
                </p>
                <p className="text-xs mt-1" style={{ color: '#64748B' }}>
                  {profile.username} will decide whether to add you
                </p>
              </div>
            ) : showRequestForm ? (
              <div className="p-4 rounded-2xl border space-y-3"
                style={{ backgroundColor: '#1B1F3B', borderColor: '#2D3158' }}>
                <p className="font-bold text-sm" style={{ color: '#F1F5F9' }}>
                  Request a Council seat
                </p>
                <p className="text-xs" style={{ color: '#64748B' }}>
                  Tell @{profile.username} why you'd be a good Council member.
                </p>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="I want to help you build because..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none
                    border resize-none"
                  style={{
                    backgroundColor: '#0F1117',
                    borderColor: '#2D3158',
                    color: '#F1F5F9',
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowRequestForm(false)}
                    className="flex-1 py-3 rounded-xl font-bold text-sm border"
                    style={{ borderColor: '#2D3158', color: '#64748B' }}>
                    Cancel
                  </button>
                  <button
                    onClick={handleRequest}
                    disabled={requestStatus === 'sending'}
                    className="flex-1 py-3 rounded-xl font-bold text-sm
                      transition-all active:scale-95 disabled:opacity-40"
                    style={{ backgroundColor: '#7C3AED', color: '#F1F5F9' }}>
                    {requestStatus === 'sending' ? 'Sending...' : 'Send Request'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => viewerId ? setShowRequestForm(true) : null}
                className="w-full py-4 rounded-2xl font-bold text-sm border
                  transition-all active:scale-95"
                style={{ borderColor: '#7C3AED', color: '#7C3AED' }}>
                {viewerId
                  ? `Request a seat on @${profile.username}'s Council`
                  : 'Sign in to request a Council seat'}
              </button>
            )}
          </div>
        )}

        {/* Owner — share prompt */}
        {isOwner && (
          <div className="p-4 rounded-2xl border text-center space-y-3"
            style={{ borderColor: '#2D3158' }}>
            <p className="text-sm font-bold" style={{ color: '#F1F5F9' }}>
              This is your public build.
            </p>
            <p className="text-xs" style={{ color: '#64748B' }}>
              Share it with people you want on your Council,
              or anyone who should see your progress.
            </p>
            <button
              onClick={handleCopyLink}
              className="px-6 py-3 rounded-xl font-bold text-sm
                transition-all active:scale-95"
              style={{ backgroundColor: '#7C3AED', color: '#F1F5F9' }}>
              {copied ? '✓ Link Copied' : '↗ Copy My Build Link'}
            </button>
          </div>
        )}

      </div>
    </main>
  )
}