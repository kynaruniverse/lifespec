'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/PageHeader'

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [userId, setUserId] = useState('')

  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [becoming, setBecoming] = useState('')
  const [profilePublic, setProfilePublic] = useState(true)
  const [councilOpen, setCouncilOpen] = useState(true)
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [usernameError, setUsernameError] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setFullName(data.full_name || '')
        setUsername(data.username || '')
        setBio(data.bio || '')
        setLocation(data.location || '')
        setBecoming(data.becoming_statement || '')
        setProfilePublic(data.profile_public ?? true)
        setCouncilOpen(data.council_requests_open ?? true)
        setEmailNotifs(data.email_notifications ?? true)
      }
      setLoading(false)
    }
    load()
  }, [router])

  const handleSave = async () => {
    if (!userId) return
    setSaving(true)
    setUsernameError('')

    if (username.trim().length < 3) {
      setUsernameError('Username must be at least 3 characters')
      setSaving(false)
      return
    }

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase().trim())
      .neq('id', userId)
      .single()

    if (existing) {
      setUsernameError('That username is already taken')
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        username: username.toLowerCase().trim(),
        bio: bio.trim() || null,
        location: location.trim() || null,
        becoming_statement: becoming.trim(),
        profile_public: profilePublic,
        council_requests_open: councilOpen,
        email_notifications: emailNotifs,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  const inputStyle = {
    backgroundColor: '#1B1F3B',
    borderColor: '#2D3158',
    color: '#F1F5F9',
  }

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#0F1117' }}>
      <p style={{ color: '#64748B' }}>Loading settings...</p>
    </main>
  )

  return (
    <main className="min-h-screen px-6 py-12"
      style={{ backgroundColor: '#0F1117' }}>
      <div className="max-w-md mx-auto space-y-8">

        <PageHeader title="Settings" backHref="/dashboard" />

        {/* Profile */}
        <div className="space-y-4">
          <p className="text-xs tracking-[0.3em] uppercase"
            style={{ color: '#64748B' }}>
            PROFILE
          </p>

          <div className="space-y-2">
            <label className="text-sm font-medium"
              style={{ color: '#64748B' }}>Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-4 rounded-2xl text-base outline-none border"
              style={inputStyle}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium"
              style={{ color: '#64748B' }}>Username</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold"
                style={{ color: '#7C3AED' }}>@</span>
              <input
                type="text"
                value={username}
                onChange={e => {
                  setUsernameError('')
                  setUsername(e.target.value
                    .replace(/[^a-zA-Z0-9_]/g, '')
                    .toLowerCase())
                }}
                maxLength={20}
                className="w-full pl-8 pr-4 py-4 rounded-2xl text-base
                  outline-none border font-mono"
                style={{
                  ...inputStyle,
                  borderColor: usernameError ? '#EF4444' : '#2D3158',
                }}
              />
            </div>
            {usernameError && (
              <p className="text-sm" style={{ color: '#EF4444' }}>
                {usernameError}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium"
              style={{ color: '#64748B' }}>Becoming statement</label>
            <textarea
              value={becoming}
              onChange={e => setBecoming(e.target.value)}
              placeholder="I am becoming someone who..."
              rows={3}
              className="w-full px-4 py-4 rounded-2xl text-base outline-none
                border resize-none"
              style={inputStyle}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium"
              style={{ color: '#64748B' }}>Bio
              <span className="ml-2 font-normal"
                style={{ color: '#2D3158' }}>(optional)</span>
            </label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="A little about you..."
              rows={2}
              className="w-full px-4 py-4 rounded-2xl text-base outline-none
                border resize-none"
              style={inputStyle}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium"
              style={{ color: '#64748B' }}>Location
              <span className="ml-2 font-normal"
                style={{ color: '#2D3158' }}>(optional)</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="City, Country"
              className="w-full px-4 py-4 rounded-2xl text-base outline-none border"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Privacy */}
        <div className="space-y-4">
          <p className="text-xs tracking-[0.3em] uppercase"
            style={{ color: '#64748B' }}>PRIVACY</p>

          {[
            {
              label: 'Public profile',
              desc: 'Anyone can view your build at /u/username',
              value: profilePublic,
              onChange: setProfilePublic,
            },
            {
              label: 'Open Council requests',
              desc: 'Allow people to request a seat on your Council',
              value: councilOpen,
              onChange: setCouncilOpen,
            },
            {
              label: 'Email notifications',
              desc: 'Get notified when your Council reviews submissions',
              value: emailNotifs,
              onChange: setEmailNotifs,
            },
          ].map(item => (
            <div key={item.label}
              className="flex items-start justify-between gap-4 p-4 rounded-2xl border"
              style={{ backgroundColor: '#1B1F3B', borderColor: '#2D3158' }}>
              <div className="space-y-1">
                <p className="font-bold text-sm" style={{ color: '#F1F5F9' }}>
                  {item.label}
                </p>
                <p className="text-xs" style={{ color: '#64748B' }}>
                  {item.desc}
                </p>
              </div>
              <button
                onClick={() => item.onChange(!item.value)}
                className="flex-shrink-0 w-12 h-6 rounded-full transition-all
                  relative"
                style={{
                  backgroundColor: item.value ? '#7C3AED' : '#2D3158',
                }}>
                <div
                  className="absolute top-1 w-4 h-4 rounded-full transition-all"
                  style={{
                    backgroundColor: '#F1F5F9',
                    left: item.value ? '26px' : '4px',
                  }}
                />
              </button>
            </div>
          ))}
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 px-6 rounded-2xl font-bold text-base
            tracking-wide transition-all active:scale-95 disabled:opacity-40"
          style={{
            backgroundColor: saved ? '#A3E635' : '#7C3AED',
            color: saved ? '#0F1117' : '#F1F5F9',
          }}>
          {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Changes'}
        </button>

        {/* Danger zone */}
        <div className="space-y-3 pt-4">
          <p className="text-xs tracking-[0.3em] uppercase"
            style={{ color: '#64748B' }}>ACCOUNT</p>
          <button
            onClick={() =>
              supabase.auth.signOut().then(() => router.push('/'))
            }
            className="w-full py-4 px-6 rounded-2xl font-bold text-base
              border transition-all active:scale-95"
            style={{ borderColor: '#2D3158', color: '#64748B' }}>
            Sign Out
          </button>
        </div>

      </div>
    </main>
  )
}