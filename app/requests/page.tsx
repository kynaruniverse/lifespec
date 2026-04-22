'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RequestsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('council_requests')
        .select('*, profiles!council_requests_requester_id_fkey(full_name, username, becoming_statement)')
        .eq('target_user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (data) setRequests(data)
      setLoading(false)
    }
    load()
  }, [router])

  const handleAccept = async (request: any) => {
    setActing(request.id)

    // Get the user's council
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: council } = await supabase
      .from('councils')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!council) return

    // Check council isn't full
    const { count } = await supabase
      .from('council_members')
      .select('id', { count: 'exact' })
      .eq('council_id', council.id)
      .eq('status', 'active')

    if ((count || 0) >= 5) {
      alert('Your Council is full. Remove a member first.')
      setActing(null)
      return
    }

    // Add as council member
    await supabase.from('council_members').insert({
      council_id: council.id,
      member_id: request.requester_id,
      status: 'active',
      joined_at: new Date().toISOString(),
    })

    // Update request status
    await supabase
      .from('council_requests')
      .update({ status: 'accepted' })
      .eq('id', request.id)

    setRequests(prev => prev.filter(r => r.id !== request.id))
    setActing(null)
  }

  const handleDecline = async (requestId: string) => {
    setActing(requestId)
    await supabase
      .from('council_requests')
      .update({ status: 'declined' })
      .eq('id', requestId)
    setRequests(prev => prev.filter(r => r.id !== requestId))
    setActing(null)
  }

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#0F1117' }}>
      <p style={{ color: '#64748B' }}>Loading requests...</p>
    </main>
  )

  return (
    <main className="min-h-screen px-6 py-12"
      style={{ backgroundColor: '#0F1117' }}>
      <div className="max-w-md mx-auto space-y-8">

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs tracking-[0.3em] uppercase"
              style={{ color: '#7C3AED' }}>STATOSPHERE</p>
            <h1 className="text-2xl font-black" style={{ color: '#F1F5F9' }}>
              Council Requests
            </h1>
          </div>
          <Link href="/dashboard"
            className="text-sm px-4 py-2 rounded-xl border"
            style={{ borderColor: '#2D3158', color: '#64748B' }}>
            ← Back
          </Link>
        </div>

        {requests.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed text-center space-y-2"
            style={{ borderColor: '#2D3158' }}>
            <p className="font-bold" style={{ color: '#F1F5F9' }}>
              No pending requests.
            </p>
            <p className="text-sm" style={{ color: '#64748B' }}>
              When someone requests a seat on your Council,
              they'll appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs tracking-widest uppercase"
              style={{ color: '#64748B' }}>
              PENDING — {requests.length}
            </p>

            {requests.map(req => (
              <div key={req.id}
                className="p-4 rounded-2xl border space-y-4"
                style={{ backgroundColor: '#1B1F3B', borderColor: '#2D3158' }}>

                <div className="space-y-1">
                  <p className="font-black" style={{ color: '#F1F5F9' }}>
                    @{req.profiles?.username}
                  </p>
                  {req.profiles?.full_name && (
                    <p className="text-sm" style={{ color: '#64748B' }}>
                      {req.profiles.full_name}
                    </p>
                  )}
                  {req.profiles?.becoming_statement && (
                    <p className="text-xs leading-relaxed pt-1"
                      style={{ color: '#64748B' }}>
                      "{req.profiles.becoming_statement}"
                    </p>
                  )}
                </div>

                {req.message && (
                  <div className="p-3 rounded-xl"
                    style={{ backgroundColor: '#0F1117' }}>
                    <p className="text-xs mb-1" style={{ color: '#64748B' }}>
                      THEIR MESSAGE
                    </p>
                    <p className="text-sm" style={{ color: '#F1F5F9' }}>
                      "{req.message}"
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleDecline(req.id)}
                    disabled={acting === req.id}
                    className="flex-1 py-3 rounded-xl font-bold text-sm border
                      transition-all active:scale-95 disabled:opacity-40"
                    style={{ borderColor: '#EF4444', color: '#EF4444' }}>
                    Decline
                  </button>
                  <button
                    onClick={() => handleAccept(req)}
                    disabled={acting === req.id}
                    className="flex-1 py-3 rounded-xl font-bold text-sm
                      transition-all active:scale-95 disabled:opacity-40"
                    style={{ backgroundColor: '#A3E635', color: '#0F1117' }}>
                    {acting === req.id ? 'Adding...' : 'Accept →'}
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}