'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/PageHeader'
import EmptyState from '@/components/EmptyState'

type Activity = {
  id: string
  type: string
  title: string
  meta: any
  created_at: string
}

export default function ActivityPage() {
  const router = useRouter()
  const [activity, setActivity] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('activity_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (data) setActivity(data)
      setLoading(false)
    }
    load()
  }, [router])

  const getActivityIcon = (type: string) => {
    if (type === 'task_approved') return '✓'
    if (type === 'task_rejected') return '✗'
    if (type === 'task_needs_more') return '→'
    return '•'
  }

  const getActivityColor = (type: string) => {
    if (type === 'task_approved') return '#A3E635'
    if (type === 'task_rejected') return '#EF4444'
    if (type === 'task_needs_more') return '#F59E0B'
    return '#64748B'
  }

  const getActivityLabel = (item: Activity) => {
    if (item.type === 'task_approved') {
      return `${item.meta?.stat} +${item.meta?.points} points`
    }
    if (item.type === 'task_rejected') {
      return `${item.meta?.stat} — not approved`
    }
    if (item.type === 'task_needs_more') {
      return `${item.meta?.stat} — needs more work`
    }
    return ''
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#0F1117' }}>
      <p style={{ color: '#64748B' }}>Loading activity...</p>
    </main>
  )

  return (
    <main className="min-h-screen px-6 py-12"
      style={{ backgroundColor: '#0F1117' }}>
      <div className="max-w-md mx-auto space-y-8">

        <PageHeader title="Activity" backHref="/dashboard" />

        {activity.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No activity yet."
            description="Your Council decisions and stat changes will appear here."
          />
        ) : (
          <div className="space-y-3">
            {activity.map(item => (
              <div key={item.id}
                className="flex items-start gap-4 p-4 rounded-2xl border"
                style={{ backgroundColor: '#1B1F3B', borderColor: '#2D3158' }}>
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center
                    font-black text-sm flex-shrink-0"
                  style={{
                    backgroundColor: '#0F1117',
                    color: getActivityColor(item.type),
                  }}>
                  {getActivityIcon(item.type)}
                </div>
                <div className="space-y-1 flex-1">
                  <p className="font-bold text-sm" style={{ color: '#F1F5F9' }}>
                    {item.title}
                  </p>
                  <p className="text-xs" style={{ color: getActivityColor(item.type) }}>
                    {getActivityLabel(item)}
                  </p>
                  <p className="text-xs" style={{ color: '#64748B' }}>
                    {formatDate(item.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}