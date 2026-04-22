import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { submission_id, decision, comment } = await request.json()

  if (!submission_id || !decision) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  if (!['approved', 'rejected', 'needs_more'].includes(decision)) {
    return NextResponse.json({ error: 'Invalid decision' }, { status: 400 })
  }

  const { data: submission } = await supabase
    .from('submissions')
    .select('id, task_id, user_id, status, tasks(council_id)')
    .eq('id', submission_id)
    .single()

  if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  if (submission.status !== 'pending') return NextResponse.json({ error: 'Already reviewed' }, { status: 400 })

  const councilId = (submission as any).tasks?.council_id

  // Check owner OR member — both can review
  const { data: council } = await supabase
    .from('councils')
    .select('owner_id')
    .eq('id', councilId)
    .single()

  const isOwner = council?.owner_id === user.id

  let isMember = false
  if (!isOwner) {
    const { data: membership } = await supabase
      .from('council_members')
      .select('id')
      .eq('council_id', councilId)
      .eq('member_id', user.id)
      .eq('status', 'active')
      .single()
    isMember = !!membership
  }

  if (!isOwner && !isMember) {
    return NextResponse.json({ error: 'Not authorised to review' }, { status: 403 })
  }

  // Insert feedback
  await supabase.from('feedback').insert({
    submission_id,
    reviewer_id: user.id,
    decision,
    comment: comment || null,
  })

  // Update submission — triggers DB streak + stat function
  await supabase
    .from('submissions')
    .update({
      status: decision,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', submission_id)

  // Fire notification email
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  fetch(`${siteUrl}/api/notify-approved`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submission_id }),
  }).catch(() => {})

  return NextResponse.json({ success: true })
}