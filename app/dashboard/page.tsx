'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { Profile, UserStat, Task } from '@/lib/types'
import Link from 'next/link'
import {
  getDaysUntilCycleEnd,
  getCycleLabel,
  getCycleUrgencyColor,
  getStreakFlame,
  getCycleKey,
} from '@/lib/cycle'

type Streak = {
  stat_category_id: string
  current_streak: number
  longest_streak: number
}

export default function DashboardPage() {
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<UserStat[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [streaks, setStreaks] = useState<Streak[]>([])
  const [pendingStatCount, setPendingStatCount] = useState(0)

  const [councilCount, setCouncilCount] = useState(0)
  const [pendingReviews, setPendingReviews] = useState(0)
  const [pendingRequests, setPendingRequests] = useState(0)

  const [loading, setLoading] = useState(true)
  const [nudging, setNudging] = useState(false)
  const [nudged, setNudged] = useState(false)
  const [copied, setCopied] = useState(false)

  const daysLeft = getDaysUntilCycleEnd()
  const cycleLabel = getCycleLabel()
  const urgencyColor = getCycleUrgencyColor(daysLeft)
  const currentCycle = getCycleKey()

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        // 🔥 Parallel base queries
        const [
          profileRes,
          statsRes,
          streaksRes,
          tasksRes,
          pendingStatsRes,
          councilRes,
          requestsRes,
          memberOfRes,
        ] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).single(),
          supabase.from('user_stats').select('*, stat_categories(*)').eq('user_id', user.id),
          supabase.from('streaks').select('*').eq('user_id', user.id),
          supabase.from('tasks')
            .select('*, stat_categories(*)')
            .eq('assigned_to', user.id)
            .eq('cycle_week', currentCycle)
            .eq('status', 'active')
            .order('created_at', { ascending: false }),
          supabase.from('pending_stat_changes')
            .select('id', { count: 'exact' })
            .eq('user_id', user.id)
            .eq('applied', false),
          supabase.from('councils').select('id').eq('owner_id', user.id).single(),
          supabase.from('council_requests')
            .select('id', { count: 'exact' })
            .eq('target_user_id', user.id)
            .eq('status', 'pending'),
          supabase.from('council_members')
            .select('council_id')
            .eq('member_id', user.id)
            .eq('status', 'active'),
        ])

        const profileData = profileRes.data
        if (!profileData?.onboarding_complete) {
          router.push('/onboarding')
          return
        }

        setProfile(profileData)
        setStats(statsRes.data || [])
        setStreaks(streaksRes.data || [])
        setTasks(tasksRes.data || [])
        setPendingStatCount(pendingStatsRes.count || 0)
        setPendingRequests(requestsRes.count || 0)

        // Council count
        if (councilRes.data) {
          const { count } = await supabase
            .from('council_members')
            .select('id', { count: 'exact' })
            .eq('council_id', councilRes.data.id)
            .eq('status', 'active')

          setCouncilCount(count || 0)
        }

        // Pending reviews
        const councilIds = new Set<string>()
        if (councilRes.data) councilIds.add(councilRes.data.id)
        memberOfRes.data?.forEach((m: any) => councilIds.add(m.council_id))

        if (councilIds.size > 0) {
          const { data: taskIds } = await supabase
            .from('tasks')
            .select('id')
            .in('council_id', Array.from(councilIds))

          if (taskIds?.length) {
            const { count } = await supabase
              .from('submissions')
              .select('id', { count: 'exact' })
              .eq('status', 'pending')
              .in('task_id', taskIds.map((t: any) => t.id))
              .neq('user_id', user.id)

            setPendingReviews(count || 0)
          }
        }

      } catch (err) {
        console.error('Dashboard load error', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [router, currentCycle])

  const handleNudge = async () => {
    setNudging(true)
    await fetch('/api/nudge-council', { method: 'POST' })
    setNudged(true)
    setNudging(false)
    setTimeout(() => setNudged(false), 4000)
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}/u/${profile?.username}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const getStreakForStat = (id: string) =>
    streaks.find(s => s.stat_category_id === id)

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#0F1117' }}>
        <p style={{ color: '#64748B' }}>Loading your build...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-6 py-12"
      style={{ backgroundColor: '#0F1117' }}>
      <div className="max-w-md mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs uppercase tracking-widest"
              style={{ color: '#7C3AED' }}>STATOSPHERE</p>
            <h1 className="text-2xl font-black"
              style={{ color: '#F1F5F9' }}>
              @{profile?.username}
            </h1>
          </div>
          <button onClick={handleCopyLink}>
            {copied ? '✓' : '↗'}
          </button>
        </div>

        {/* CYCLE */}
        <div className="p-4 rounded-xl border flex justify-between"
          style={{ background: '#1B1F3B', borderColor: '#2D3158' }}>
          <div>
            <p className="text-xs">CURRENT CYCLE</p>
            <p>{cycleLabel}</p>
          </div>
          <div style={{ color: urgencyColor }}>
            {daysLeft === 0 ? 'Today' : `${daysLeft}d`}
          </div>
        </div>

        {/* 🔥 NEW: Pending stats */}
        {pendingStatCount > 0 && (
          <div className="p-4 rounded-xl border"
            style={{ borderColor: '#A3E635' }}>
            <p style={{ color: '#A3E635' }}>
              +{pendingStatCount} stat gain{pendingStatCount > 1 ? 's' : ''} pending
            </p>
            <p className="text-xs" style={{ color: '#64748B' }}>
              Will apply at cycle end
            </p>
          </div>
        )}

        {/* STATS */}
        {stats.map(stat => {
          const streak = getStreakForStat(stat.stat_category_id)
          return (
            <div key={stat.id}>
              <p>
                {(stat as any).stat_categories?.name}
                {streak && ` ${getStreakFlame(streak.current_streak)}`}
              </p>
              <p>{stat.current_value}</p>
            </div>
          )
        })}

        {/* TASKS */}
        {tasks.map(task => (
          <Link key={task.id} href={`/tasks/${task.id}`}>
            <div>{task.title}</div>
          </Link>
        ))}

      </div>
    </main>
  )
}