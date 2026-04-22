import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import PublicProfileClient from './PublicProfileClient'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username, becoming_statement')
    .eq('username', username.toLowerCase())
    .single()

  if (!profile) return { title: 'Profile not found — Statosphere' }

  return {
    title: `@${profile.username} — Statosphere`,
    description: profile.becoming_statement
      ? `"${profile.becoming_statement}"`
      : `${profile.full_name || profile.username}'s build on Statosphere`,
  }
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username.toLowerCase())
    .eq('profile_public', true)
    .single()

  if (!profile) notFound()

  const { data: userStats } = await supabase
    .from('user_stats')
    .select('*, stat_categories(*)')
    .eq('user_id', profile.id)

  const { data: streaks } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', profile.id)

  const { data: council } = await supabase
    .from('councils')
    .select('id')
    .eq('owner_id', profile.id)
    .single()

  const { count: councilSize } = await supabase
    .from('council_members')
    .select('id', { count: 'exact' })
    .eq('council_id', council?.id || '')
    .eq('status', 'active')

  const { count: approvedCount } = await supabase
    .from('submissions')
    .select('id', { count: 'exact' })
    .eq('user_id', profile.id)
    .eq('status', 'approved')

  return (
    <PublicProfileClient
      profile={profile}
      userStats={userStats || []}
      streaks={streaks || []}
      councilSize={councilSize || 0}
      approvedCount={approvedCount || 0}
    />
  )
}