import React, { useEffect, useState } from 'react'
import { API } from '../../context/AuthContext'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import {
  LayoutDashboard,
} from 'lucide-react'

// ─── Main FacultyDashboard ────────────────────────────────────────────────────
export default function FacultyDashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)

  // Load faculty profile
  useEffect(() => {
    API.get('/faculty/profile')
      .then(r => setProfile(r.data.data))
      .catch(() => toast.error('Could not load faculty profile'))
      .finally(() => setProfileLoading(false))
  }, [])

  if (profileLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
      <div className="spinner" /><span style={{ color: 'var(--text-muted)' }}>Loading…</span>
    </div>
  )

  if (!profile) return (
    <div className="card" style={{ textAlign: 'center', padding: 64, color: 'var(--text-muted)' }}>
      Faculty profile not found. Contact the administrator.
    </div>
  )

  return (
    <div className="page-enter" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── Hero Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #7c3aed 0%, #9d5cf5 100%)',
        borderRadius: 20, padding: '24px 28px', marginBottom: 24,
        boxShadow: '0 8px 32px rgba(124,58,237,0.25)', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900, color: '#fff', fontFamily: 'Outfit, sans-serif', flexShrink: 0 }}>
            {profile.name?.charAt(0)}
          </div>
          <div style={{ flex: 1, color: '#fff' }}>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>{profile.name}</div>
            <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>Faculty ID: {profile.facultyId}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <span style={{ padding: '3px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)' }}>
                📚 {profile.subject}
              </span>
              {profile.subjectCode && (
                <span style={{ padding: '3px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: 'rgba(255,255,255,0.15)', fontFamily: 'monospace' }}>
                  {profile.subjectCode}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}