import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username')
    .eq('id', user.id)
    .single()

  const userName = profile?.full_name || profile?.username || 'Someone'

  // Get user's council and active members
  const { data: council } = await supabase
    .from('councils')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!council) return NextResponse.json({ error: 'No council' }, { status: 400 })

  const { data: members } = await supabase
    .from('council_members')
    .select('member_id, profiles(full_name, username)')
    .eq('council_id', council.id)
    .eq('status', 'active')

  if (!members || members.length === 0) {
    return NextResponse.json({ error: 'No active members' }, { status: 400 })
  }

  // Get member email addresses from auth
  const nudgePromises = members.map(async (member: any) => {
    const { data: authUser } = await supabase.auth.admin.getUserById(member.member_id)
    const memberEmail = authUser?.user?.email
    if (!memberEmail) return

    await resend.emails.send({
      from: 'Statosphere <onboarding@resend.dev>',
      to: memberEmail,
      subject: `${userName} needs your Council feedback — Statosphere`,
      html: `
        <div style="background:#0F1117;color:#F1F5F9;font-family:sans-serif;
          max-width:480px;margin:0 auto;padding:48px 32px;border-radius:16px;">
          <p style="color:#7C3AED;letter-spacing:0.3em;font-size:11px;
            text-transform:uppercase;margin-bottom:32px;">STATOSPHERE</p>
          <h1 style="font-size:28px;font-weight:900;line-height:1.2;margin-bottom:16px;">
            ${userName} is waiting<br/>on your feedback.
          </h1>
          <p style="color:#64748B;line-height:1.7;margin-bottom:32px;">
            Their week depends on your Council staying active.
            Takes 30 seconds — tap to review.
          </p>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/review"
            style="display:block;background:#7C3AED;color:#F1F5F9;
              text-decoration:none;padding:16px 24px;border-radius:12px;
              font-weight:700;font-size:16px;text-align:center;">
            Review Now →
          </a>
          <p style="color:#2D3158;font-size:12px;margin-top:32px;text-align:center;">
            — Statosphere
          </p>
        </div>
      `,
    })
  })

  await Promise.allSettled(nudgePromises)
  return NextResponse.json({ success: true })
}