import React, { useEffect, useState } from 'react'
import { API } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { Users, Calendar, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react'

export default function FacultyDashboard() {
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [stats, setStats] = useState({ totalStudents:0, classesRecorded:0, eligibleStudents:0, shortAttendance:0, avgAttendance:'0.0' })

  useEffect(() => {
    API.get('/faculty/profile')
      .then(r => setProfile(r.data.data))
      .catch(() => toast.error('Could not load faculty profile'))
      .finally(() => setProfileLoading(false))
  }, [])

  useEffect(() => {
    if (!profile) return
    const month = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`
    Promise.all([
      API.get('/attendance-sheet/students'),
      API.get(`/attendance-sheet?month=${month}`),
    ]).then(([studRes, attRes]) => {
      const students = studRes.data.data || []
      const docs     = attRes.data.data  || []

      // Build map: enrollmentNumber → { date → status }
      const map = {}
      const datesSet = new Set()
      docs.forEach(doc => {
        if (!doc.date) return
        datesSet.add(doc.date)
        ;(doc.records || []).forEach(r => {
          if (!map[r.enrollmentNumber]) map[r.enrollmentNumber] = {}
          map[r.enrollmentNumber][doc.date] = r.status
        })
      })

      // Working days = dates with at least one P or A
      const allDates = [...datesSet].sort()
      const workingDays = allDates.filter(d =>
        students.some(s => { const st = map[s.enrollmentNumber]?.[d]; return st==='P'||st==='A' })
      )

      const threshold = 75
      let totalPresent = 0, eligibleCount = 0
      students.forEach(s => {
        let present = 0
        workingDays.forEach(d => { if (map[s.enrollmentNumber]?.[d]==='P') present++ })
        totalPresent += present
        const pct = workingDays.length > 0 ? (present / workingDays.length) * 100 : 0
        if (pct >= threshold) eligibleCount++
      })

      const totalPossible = students.length * workingDays.length
      const avgPct = totalPossible > 0 ? ((totalPresent / totalPossible) * 100).toFixed(1) : '0.0'

      setStats({
        totalStudents:    students.length,
        classesRecorded:  workingDays.length,
        eligibleStudents: eligibleCount,
        shortAttendance:  students.length - eligibleCount,
        avgAttendance:    avgPct,
      })
    }).catch(() => {})
  }, [profile])

  if (profileLoading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', gap:12 }}>
      <div className="spinner"/><span style={{ color:'var(--text-muted)' }}>Loading…</span>
    </div>
  )

  if (!profile) return (
    <div className="card" style={{ textAlign:'center', padding:64, color:'var(--text-muted)' }}>
      Faculty profile not found. Contact the administrator.
    </div>
  )

  return (
    <div className="page-enter">
      {/* Hero Banner */}
      <div style={{ background:'linear-gradient(135deg, var(--accent) 0%, var(--accent-mid) 100%)', borderRadius:'var(--radius-xl)', padding:'24px 28px', marginBottom:24, boxShadow:'0 8px 32px rgba(124,58,237,0.25)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-50, right:-50, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none' }}/>
        <div style={{ display:'flex', alignItems:'center', gap:18, flexWrap:'wrap' }}>
          <div style={{ width:64, height:64, borderRadius:18, background:'rgba(255,255,255,0.18)', border:'2px solid rgba(255,255,255,0.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, fontWeight:900, color:'#fff', fontFamily:'var(--font-display)', flexShrink:0 }}>
            {profile.name?.charAt(0)}
          </div>
          <div style={{ flex:1, color:'#fff' }}>
            <div style={{ fontSize:22, fontWeight:800, fontFamily:'var(--font-display)', letterSpacing:'-0.02em' }}>{profile.name}</div>
            <div style={{ fontSize:13, opacity:0.8, marginTop:4 }}>Faculty ID: {profile.facultyId}</div>
            <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
              <span style={{ padding:'3px 12px', borderRadius:99, fontSize:12, fontWeight:700, background:'rgba(255,255,255,0.2)', border:'1px solid rgba(255,255,255,0.3)' }}>📚 {profile.subject}</span>
              {profile.subjectCode && <span style={{ padding:'3px 12px', borderRadius:99, fontSize:12, fontWeight:700, background:'rgba(255,255,255,0.15)', fontFamily:'monospace' }}>{profile.subjectCode}</span>}
            </div>
          </div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            {[
              { label:'Students', value:stats.totalStudents,   icon:'👥' },
              { label:'Classes',  value:stats.classesRecorded, icon:'📅' },
              { label:'Eligible', value:stats.eligibleStudents,icon:'✅' },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign:'center', background:'rgba(255,255,255,0.15)', backdropFilter:'blur(8px)', borderRadius:14, padding:'12px 18px', border:'1px solid rgba(255,255,255,0.25)' }}>
                <div style={{ fontSize:20, marginBottom:2 }}>{stat.icon}</div>
                <div style={{ fontSize:22, fontWeight:900, color:'#fff', fontFamily:'var(--font-display)', lineHeight:1 }}>{stat.value}</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.7)', marginTop:2, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:14 }}>
        {[
          { label:'Total Students',   value:stats.totalStudents,              icon:Users,         color:'var(--accent)' },
          { label:'Classes Recorded', value:stats.classesRecorded,            icon:Calendar,      color:'var(--blue)'   },
          { label:'Eligible Students',value:stats.eligibleStudents,           icon:CheckCircle,   color:'var(--green)', sub:'≥ 75%' },
          { label:'Short Attendance', value:stats.shortAttendance,            icon:AlertTriangle, color:'var(--red)',   sub:'< 75%' },
          { label:'Avg Attendance',   value:`${stats.avgAttendance}%`,        icon:TrendingUp,    color:'var(--purple)' },
        ].map(({ label, value, icon:Icon, color, sub }) => (
          <div key={label} className="stat-card">
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
              <div style={{ width:38, height:38, borderRadius:'var(--radius)', background:`${color}18`, border:`1px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon size={17} color={color} strokeWidth={2}/>
              </div>
            </div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:'1.7rem', fontWeight:800, color:'var(--text-primary)', lineHeight:1 }}>{value}</div>
            <div style={{ marginTop:5, fontSize:'0.75rem', fontFamily:'var(--font-display)', fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</div>
            {sub && <div style={{ marginTop:3, fontSize:'0.7rem', color }}>{sub}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}