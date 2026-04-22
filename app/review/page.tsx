'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ReviewPage() {
  const router = useRouter()

  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [reviewing, setReviewing] = useState<string | null>(null)
  const [activeSubmission, setActiveSubmission] = useState<string | null>(null)
  const [comment, setComment] = useState('')

  const [hasCouncil, setHasCouncil] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // 🔥 Get councils
      const { data: memberOf } = await supabase
        .from('council_members')
        .select('council_id')
        .eq('member_id', user.id)
        .eq('status', 'active')

      const { data: ownedCouncil } = await supabase
        .from('councils')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      // ✅ Deduplicated council IDs
      const councilIds = Array.from(new Set([
        ...(ownedCouncil ? [ownedCouncil.id] : []),
        ...(memberOf ? memberOf.map((m: any) => m.council_id) : [])
      ]))

      if (councilIds.length === 0) {
        setHasCouncil(false)
        setLoading(false)
        return
      }

      // 🔥 Get tasks for councils
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id')
        .in('council_id', councilIds)

      const taskIds = tasks?.map(t => t.id) || []

      if (taskIds.length === 0) {
        setSubmissions([])
        setLoading(false)
        return
      }

      // 🔥 Get submissions
      const { data: subsData } = await supabase
        .from('submissions')
        .select(`
          *,
          tasks(*, stat_categories(*)),
          profiles(full_name, username)
        `)
        .eq('status', 'pending')
        .in('task_id', taskIds)
        .neq('user_id', user.id)
        .order('submitted_at', { ascending: false })

      setSubmissions(subsData || [])
      setLoading(false)
    }

    load()
  }, [router])

  const handleDecision = async (submissionId: string, decision: string) => {
    setReviewing(submissionId)

    try {
      const res = await fetch('/api/review-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: submissionId,
          decision,
          comment: comment.trim() || null,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed')
      }

      setSubmissions(prev => prev.filter(s => s.id !== submissionId))
      setActiveSubmission(null)
      setComment('')
    } catch (err) {
      console.error(err)
    }

    setReviewing(null)
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#0F1117' }}>
        <p style={{ color: '#64748B' }}>Loading submissions...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-6 py-12"
      style={{ backgroundColor: '#0F1117' }}>
      <div className="max-w-md mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black text-white">Council Review</h1>
          <Link href="/dashboard">← Back</Link>
        </div>

        {/* Empty states */}
        {!hasCouncil ? (
          <div className="text-center">
            <p className="text-white font-bold">You're not in a Council yet.</p>
            <p className="text-sm text-gray-400">
              Join or create one to start reviewing.
            </p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center">
            <p className="text-white font-bold">Nothing to review.</p>
            <p className="text-sm text-gray-400">
              When someone submits progress, you'll see it here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">

            <p className="text-xs text-gray-400">
              {submissions.length} awaiting your judgment
            </p>

            {submissions.map(sub => (
              <div key={sub.id} className="border p-4 rounded-xl">

                <p className="font-bold">
                  {sub.profiles?.full_name || `@${sub.profiles?.username}`}
                </p>

                <p className="text-sm text-gray-400">
                  {sub.tasks?.title}
                </p>

                {sub.note && <p>"{sub.note}"</p>}

                {activeSubmission === sub.id ? (
                  <div className="mt-3 space-y-2">

                    <p className="text-sm text-gray-400">
                      Your feedback shapes their growth.
                    </p>

                    <textarea
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder="What did they do well? What should improve?"
                    />

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDecision(sub.id, 'approved')}
                        disabled={reviewing === sub.id}>
                        Approve
                      </button>

                      <button
                        onClick={() => handleDecision(sub.id, 'needs_more')}
                        disabled={reviewing === sub.id}>
                        Needs More
                      </button>

                      <button
                        onClick={() => handleDecision(sub.id, 'rejected')}
                        disabled={reviewing === sub.id}>
                        Reject
                      </button>
                    </div>

                    <button onClick={() => setActiveSubmission(null)}>
                      Cancel
                    </button>

                  </div>
                ) : (
                  <button onClick={() => setActiveSubmission(sub.id)}>
                    Review
                  </button>
                )}

              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}