'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function TaskDetailPage() {
  const router = useRouter()
  const params = useParams()
  const taskId = params.id as string

  const [task, setTask] = useState<any>(null)
  const [submission, setSubmission] = useState<any>(null)
  const [userId, setUserId] = useState<string>('')

  const [note, setNote] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      setUserId(user.id)

      // 🔥 Load task
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select(`
          *,
          stat_categories(*),
          assigner:profiles!tasks_assigned_by_fkey(full_name, username)
        `)
        .eq('id', taskId)
        .single()

      if (taskError || !taskData) {
        router.push('/dashboard')
        return
      }

      setTask(taskData)

      // 🔥 Load latest submission safely
      const { data: subData } = await supabase
        .from('submissions')
        .select('*, feedback(*)')
        .eq('task_id', taskId)
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false })
        .limit(1)

      if (subData && subData.length > 0) {
        setSubmission(subData[0])
      }

      setPageLoading(false)
    }

    load()
  }, [taskId, router])

  const handleSubmit = async () => {
    if (!note.trim() && !file) return
    if (!task || task.assigned_to !== userId) return

    setLoading(true)

    let mediaUrl: string | null = null

    // ✅ Upload media
    if (file) {
      const ext = file.name.split('.').pop()
      const path = `${userId}/${taskId}-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('submissions')
        .upload(path, file)

      if (uploadError) {
        console.error(uploadError)
        setLoading(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from('submissions')
        .getPublicUrl(path)

      mediaUrl = urlData.publicUrl
    }

    // ❌ Prevent duplicate pending submissions
    if (submission?.status === 'pending') {
      setLoading(false)
      return
    }

    const { data: newSubmission, error } = await supabase
      .from('submissions')
      .insert({
        task_id: taskId,
        user_id: userId,
        note: note.trim() || null,
        media_url: mediaUrl,
        status: 'pending',
      })
      .select()
      .single()

    if (!error && newSubmission) {
      setSubmission(newSubmission)
      setSubmitted(true)
    }

    setLoading(false)
  }

  const statusColor = (status: string) => {
    if (status === 'approved') return '#A3E635'
    if (status === 'rejected') return '#EF4444'
    if (status === 'needs_more') return '#F59E0B'
    if (status === 'pending') return '#7C3AED'
    return '#64748B'
  }

  const statusLabel = (status: string) => {
    if (status === 'approved') return '✓ Approved'
    if (status === 'rejected') return '✗ Rejected'
    if (status === 'needs_more') return '→ Needs More'
    if (status === 'pending') return 'Awaiting review'
    return status
  }

  if (pageLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#0F1117' }}>
        <p style={{ color: '#64748B' }}>Loading task...</p>
      </main>
    )
  }

  if (!task) return null

  const isAssignedToMe = task.assigned_to === userId
  const canSubmit = isAssignedToMe && task.status === 'active'
  const hasPendingSubmission = submission?.status === 'pending'

  return (
    <main className="min-h-screen px-6 py-12"
      style={{ backgroundColor: '#0F1117' }}>
      <div className="max-w-md mx-auto space-y-6">

        {/* Header */}
        <div className="flex justify-between">
          <Link href="/dashboard">← Back</Link>
          <span style={{ color: statusColor(task.status) }}>
            {statusLabel(task.status)}
          </span>
        </div>

        {/* Task */}
        <div>
          <h1>{task.title}</h1>
          {task.assigner && (
            <p>
              Assigned by{' '}
              <strong>
                {task.assigner.full_name || `@${task.assigner.username}`}
              </strong>
            </p>
          )}
        </div>

        {/* Existing submission */}
        {submission && (
          <div>
            <p>{statusLabel(submission.status)}</p>
            {submission.note && <p>"{submission.note}"</p>}
            {submission.media_url && (
              <img src={submission.media_url} alt="" />
            )}
          </div>
        )}

        {/* Submit */}
        {canSubmit && !hasPendingSubmission && !submitted && (
          <div>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="What did you do?"
            />

            <input
              type="file"
              onChange={e => setFile(e.target.files?.[0] || null)}
            />

            <button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        )}

        {/* Success */}
        {submitted && (
          <div>
            <p>Submitted to your Council.</p>
            <p>
              {task.assigner
                ? `Now ${task.assigner.full_name || 'they'} will review it.`
                : 'They will review it soon.'}
            </p>
          </div>
        )}

        {/* Waiting */}
        {hasPendingSubmission && !submitted && (
          <div>
            <p>Waiting for your Council.</p>
          </div>
        )}

      </div>
    </main>
  )
}