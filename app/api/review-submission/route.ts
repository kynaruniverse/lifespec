import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient()

  // ✅ Auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { submission_id, decision, comment } = body

  if (!submission_id || !decision) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  if (!['approved', 'rejected', 'needs_more'].includes(decision)) {
    return NextResponse.json({ error: 'Invalid decision' }, { status: 400 })
  }

  // ✅ Fetch submission + task
  const { data: submission, error: submissionError } = await supabase
    .from('submissions')
    .select(`
      id,
      task_id,
      user_id,
      status,
      tasks (
        id,
        council_id,
        assigned_to,
        assigned_by
      )
    `)
    .eq('id', submission_id)
    .single()

  if (submissionError || !submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  }

  if (submission.status !== 'pending') {
    return NextResponse.json({ error: 'Already reviewed' }, { status: 400 })
  }

  const task = submission.tasks
  const councilId = task?.council_id

  if (!task || !councilId) {
    return NextResponse.json({ error: 'Invalid task data' }, { status: 500 })
  }

  // ❌ Prevent self-review (IMPORTANT)
  if (submission.user_id === user.id) {
    return NextResponse.json({ error: 'Cannot review your own submission' }, { status: 403 })
  }

  // ✅ Check permissions
  const { data: council } = await supabase
    .from('councils')
    .select('owner_id')
    .eq('id', councilId)
    .single()

  const { data: membership } = await supabase
    .from('council_members')
    .select('id')
    .eq('council_id', councilId)
    .eq('member_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  const isOwner = council?.owner_id === user.id
  const isMember = !!membership

  if (!isOwner && !isMember) {
    return NextResponse.json({ error: 'Not authorised to review' }, { status: 403 })
  }

  // ✅ Insert feedback (now supports type)
  await supabase.from('feedback').insert({
    submission_id,
    reviewer_id: user.id,
    type: 'review',
    decision,
    comment: comment || null,
  })

  // ✅ Update submission
  const { error: updateError } = await supabase
    .from('submissions')
    .update({
      status: decision,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', submission_id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // ✅ If approved → create pending stat change (NEW CORE LOGIC)
  if (decision === 'approved') {
    await supabase.from('pending_stat_changes').insert({
      user_id: submission.user_id,
      stat_category_id: task.stat_category_id,
      delta: 1, // you can scale this later
      source: 'task',
      source_id: task.id,
      applied: false,
    }).catch(() => {})
  }

  // ✅ Mark task completed if approved
  if (decision === 'approved') {
    await supabase
      .from('tasks')
      .update({ status: 'completed' })
      .eq('id', task.id)
      .catch(() => {})
  }

  // ✅ Track reviewer activity
  await supabase
    .from('council_activity')
    .upsert({
      council_member_id: membership?.id,
      last_active_at: new Date().toISOString()
    })
    .catch(() => {})

  // ✅ Fire notification (non-blocking)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (siteUrl) {
    fetch(`${siteUrl}/api/notify-approved`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submission_id }),
    }).catch(() => {})
  }

  return NextResponse.json({ success: true })
}