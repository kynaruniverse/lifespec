import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient()

  // ✅ Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ✅ Parse body
  const body = await request.json()
  const {
    council_id,
    assigned_to,
    stat_category_id,
    title,
    description,
    due_date
  } = body

  if (!council_id || !assigned_to || !stat_category_id || !title) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // ✅ Validate council + permissions
  const { data: council, error: councilError } = await supabase
    .from('councils')
    .select('id, owner_id')
    .eq('id', council_id)
    .single()

  if (councilError || !council) {
    return NextResponse.json({ error: 'Council not found' }, { status: 404 })
  }

  const { data: membership } = await supabase
    .from('council_members')
    .select('id, status')
    .eq('council_id', council_id)
    .eq('member_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  const isOwner = council.owner_id === user.id
  const isMember = !!membership

  if (!isOwner && !isMember) {
    return NextResponse.json({ error: 'Not a council member' }, { status: 403 })
  }

  // ✅ Ensure assigned user is part of council
  const { data: assignedMember } = await supabase
    .from('council_members')
    .select('id')
    .eq('council_id', council_id)
    .eq('member_id', assigned_to)
    .eq('status', 'active')
    .maybeSingle()

  if (!assignedMember && assigned_to !== council.owner_id) {
    return NextResponse.json({ error: 'Assigned user is not in this council' }, { status: 400 })
  }

  // ✅ Optional: attach to current cycle (basic version)
  const cycle_week = new Date().toISOString().slice(0, 10) // simple placeholder (upgrade later)

  // ✅ Create task
  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      council_id,
      assigned_to,
      assigned_by: user.id,
      stat_category_id,
      title,
      description: description || null,
      due_date: due_date || null,
      cycle_week,
      status: 'active',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // ✅ Track council activity (lightweight)
  await supabase
    .from('council_activity')
    .upsert({
      council_member_id: membership?.id,
      last_active_at: new Date().toISOString()
    })
    .catch(() => {})

  return NextResponse.json({ success: true, task })
}