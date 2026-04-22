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

  const { council_id, assigned_to, stat_category_id, title, description, due_date }
    = await request.json()

  if (!council_id || !assigned_to || !stat_category_id || !title) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Check if user is owner OR active member — either role can assign tasks
  const { data: council } = await supabase
    .from('councils')
    .select('owner_id')
    .eq('id', council_id)
    .single()

  const isOwner = council?.owner_id === user.id

  let isMember = false
  if (!isOwner) {
    const { data: membership } = await supabase
      .from('council_members')
      .select('id')
      .eq('council_id', council_id)
      .eq('member_id', user.id)
      .eq('status', 'active')
      .single()
    isMember = !!membership
  }

  if (!isOwner && !isMember) {
    return NextResponse.json({ error: 'Not a council member' }, { status: 403 })
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      council_id,
      assigned_to,
      assigned_by: user.id,
      stat_category_id,
      title,
      description,
      due_date,
      status: 'active',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log activity — works for both owners and members
  await supabase.rpc('log_activity', {
    p_user_id: user.id,
    p_type: 'task_assigned',
    p_title: title,
    p_meta: { council_id, assigned_to },
  })

  return NextResponse.json({ success: true, task })
}