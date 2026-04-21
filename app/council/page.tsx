'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { CouncilMember } from '@/lib/types'
import Link from 'next/link'

export default function CouncilPage() {
  const router = useRouter()
  const [members, setMembers] = useState<CouncilMember[]>([])
  const [councilId, setCouncilId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [inviteStatus, setInviteStatus] = useState<'idle'|'sending'|'sent'|'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: council } = await supabase
        .from('councils')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      if (!council) { setPageLoading(false); return }
      setCouncilId(council.id)

      const { data: membersData } = await supabase
        .from('council_members')
        .select('*, profiles(*)')
        .eq('council_id', council.id)
        .order('invited_at', { ascending: false })

      if (membersData) setMembers(membersData)
      setPageLoading(false)
    }
    load()
  }, [router])

  const handleInvite = async () => {
    if (!email || !councilId) return
    setInviteStatus('sending')
    setErrorMsg('')

    const res = await fetch('/api/invite-council', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    const data = await res.json()

    if (data.success) {
      setInviteStatus('sent')
      setEmail('')
      // Refresh members list
      const { data: membersData } = await supabase
        .from('council_members')
        .select('*, profiles(*)')
        .eq('council_id', councilId)
        .order('invited_at', { ascending: false })
      if (membersData) setMembers(membersData)
      setTimeout(() => setInviteStatus('idle'), 3000)
    } else {
      setErrorMsg(data.error || 'Failed to send invite')
      setInviteStatus('error')
    }
  }

  const statusColor = (status: string) => {
    if (status === 'active') return '#A3E635'
    if (status === 'pending') return '#F59E0B'
    return '#64748B'
  }

  const statusLabel = (status: string) => {
    if (status === 'active') return 'Active'
    if (status === 'pending') return 'Invite sent'
    return status
  }

  if (pageLoading) return (
    <main className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#0F1117' }}>
      <p style={{ color: '#64748B' }}>Loading your Council...</p>
    </main>
  )

  return (
    <main className="min-h-screen px-6 py-12"
      style={{ backgroundColor: '#0F1117' }}>
      <div className="max-w-md mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs tracking-[0.3em] uppercase"
              style={{ color: '#7C3AED' }}>
              STATOSPHERE
            </p>
            <h1 className="text-2xl font-black"
              style={{ color: '#F1F5F9' }}>
              Your Council
            </h1>
          </div>
          <Link href="/dashboard"
            className="text-sm px-4 py-2 rounded-xl border"
            style={{ borderColor: '#2D3158', color: '#64748B' }}>
            ← Back
          </Link>
        </div>

        {/* Invite form */}
        <div className="p-5 rounded-2xl border space-y-4"
          style={{ backgroundColor: '#1B1F3B', borderColor: '#2D3158' }}>
          <div className="space-y-1">
            <p className="font-bold" style={{ color: '#F1F5F9' }}>
              Invite someone
            </p>
            <p className="text-sm" style={{ color: '#64748B' }}>
              Choose people who will be honest with you.
            </p>
          </div>

          <div className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={e => {
                setEmail(e.target.value)
                setInviteStatus('idle')
                setErrorMsg('')
              }}
              onKeyDown={e => e.key === 'Enter' && handleInvite()}
              placeholder="their@email.com"
              className="w-full px-4 py-3 rounded-xl text-base outline-none border"
              style={{
                backgroundColor: '#0F1117',
                borderColor: '#2D3158',
                color: '#F1F5F9',
              }}
            />

            <button
              onClick={handleInvite}
              disabled={!email || inviteStatus === 'sending'}
              className="w-full py-3 px-6 rounded-xl font-bold text-sm
                tracking-wide transition-all active:scale-95 disabled:opacity-40"
              style={{ backgroundColor: '#7C3AED', color: '#F1F5F9' }}>
              {inviteStatus === 'sending' ? 'Sending...'
                : inviteStatus === 'sent' ? '✓ Invite Sent!'
                : 'Send Invite →'}
            </button>

            {errorMsg && (
              <p className="text-sm text-center" style={{ color: '#EF4444' }}>
                {errorMsg}
              </p>
            )}
          </div>
        </div>

        {/* Members list */}
        <div className="space-y-3">
          <p className="text-xs tracking-[0.3em] uppercase"
            style={{ color: '#64748B' }}>
            COUNCIL MEMBERS — {members.length} / 5
          </p>

          {members.length === 0 && (
            <div className="p-5 rounded-2xl border border-dashed text-center"
              style={{ borderColor: '#2D3158' }}>
              <p style={{ color: '#64748B' }}>
                Your Council is empty.
                Invite trusted people above.
              </p>
            </div>
          )}

          {members.map(member => (
            <div key={member.id}
              className="p-4 rounded-2xl border flex items-center justify-between"
              style={{ backgroundColor: '#1B1F3B', borderColor: '#2D3158' }}>
              <div className="space-y-1">
                <p className="font-bold text-sm" style={{ color: '#F1F5F9' }}>
                  {(member as any).profiles?.full_name
                    || (member as any).profiles?.username
                    || member.invite_email
                    || 'Invited member'}
                </p>
                {(member as any).profiles?.username && (
                  <p className="text-xs" style={{ color: '#64748B' }}>
                    @{(member as any).profiles.username}
                  </p>
                )}
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full"
                style={{
                  backgroundColor: '#0F1117',
                  color: statusColor(member.status)
                }}>
                {statusLabel(member.status)}
              </span>
            </div>
          ))}
        </div>

      </div>
    </main>
  )
}