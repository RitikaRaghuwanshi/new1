import React, { useEffect, useState, useRef, useCallback } from 'react'
import { API } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import {
  Plus, Save, Trash2, Download, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Calendar, BarChart2, RefreshCw,
  Users, AlertTriangle, X
} from 'lucide-react'

/* ── palette ──────────────────────────────────────────────────────────── */
const C = {
  bg:       '#0f1117',
  surface:  '#e7e9f0',
  panel:    '#1a70bb',
  border:   '#262d3f',
  borderL:  '#cad2ec',
  accent:   '#7c5cfc',
  accentL:  'rgba(124,92,252,0.15)',
  green:    '#22c55e',
  greenL:   'rgba(34,197,94,0.12)',
  red:      '#ef4444',
  redL:     'rgba(239,68,68,0.12)',
  amber:    '#f59e0b',
  amberL:   'rgba(245,158,11,0.12)',
  blue:     '#3b82f6',
  blueL:    'rgba(59,130,246,0.12)',
  text:     '#f1f5f9',
  sub:      '#94a3b8',
  muted:    '#4b5563',
  present:  '#22c55e',
  absent:   '#ef4444',
  leave:    '#f59e0b',
}

/* ── helpers ──────────────────────────────────────────────────────────── */
const today = () => new Date().toISOString().slice(0, 10)
const fmtDate = d => {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}/${m}`
}
const fmtDateFull = d => {
  if (!d) return ''
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' })
}
const monthLabel = m => {
  const [y, mon] = m.split('-')
  return new Date(y, mon - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}
const prevMonth = m => {
  const d = new Date(m + '-01')
  d.setMonth(d.getMonth() - 1)
  return d.toISOString().slice(0, 7)
}
const nextMonth = m => {
  const d = new Date(m + '-01')
  d.setMonth(d.getMonth() + 1)
  return d.toISOString().slice(0, 7)
}

/* ── status cycle P → A → L → P ──────────────────────────────────────── */
const cycleStatus = s => s === 'P' ? 'A' : s === 'A' ? 'L' : 'P'
const statusStyle = s => ({
  P: { bg: C.greenL, color: C.green,   border: 'rgba(34,197,94,0.3)',  label: 'P' },
  A: { bg: C.redL,   color: C.red,     border: 'rgba(239,68,68,0.3)',  label: 'A' },
  L: { bg: C.amberL, color: C.amber,   border: 'rgba(245,158,11,0.3)', label: 'L' },
  '':{ bg: C.border, color: C.muted,   border: C.border,               label: '–' },
}[s] || { bg: C.border, color: C.muted, border: C.border, label: '–' })

export default function AttendanceSheet() {
  const [students,    setStudents]    = useState([])   // [{enrollmentNumber, name, division}]
  const [dates,       setDates]       = useState([])   // ["YYYY-MM-DD", ...]  sorted
  const [grid,        setGrid]        = useState({})   // { date: { enroll: 'P'/'A'/'L' } }
  const [month,       setMonth]       = useState(today().slice(0, 7))
  const [faculty,     setFaculty]     = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(null) // date being saved
  const [tab,         setTab]         = useState('sheet') // 'sheet' | 'summary'
  const [addDateVal,  setAddDateVal]  = useState(today())
  const [showAddDate, setShowAddDate] = useState(false)
  const [dirtyDates,  setDirtyDates]  = useState(new Set()) // dates with unsaved changes
  const [summary,     setSummary]     = useState(null)
  const tableRef = useRef()

  /* ── load students + attendance for month ─────────────────────────── */
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [stuRes, attRes] = await Promise.all([
        API.get('/attendance-sheet/students'),
        API.get(`/attendance-sheet?month=${month}`),
      ])
      const stus = stuRes.data.data || []
      setStudents(stus)
      setFaculty(stuRes.data.faculty)

      const docs = attRes.data.data || []
      const newGrid = {}
      const newDates = []

      for (const doc of docs) {
        newDates.push(doc.date)
        newGrid[doc.date] = {}
        for (const r of doc.records) {
          newGrid[doc.date][r.enrollmentNumber] = r.status
        }
        // fill missing students as 'A' so they show in the grid
        for (const s of stus) {
          if (!(s.enrollmentNumber in newGrid[doc.date])) {
            newGrid[doc.date][s.enrollmentNumber] = 'A'
          }
        }
      }
      setDates(newDates.sort())
      setGrid(newGrid)
      setDirtyDates(new Set())
    } catch (err) {
      toast.error('Failed to load attendance')
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => { loadData() }, [loadData])

  /* ── load summary ─────────────────────────────────────────────────── */
  const loadSummary = async () => {
    try {
      const { data } = await API.get(`/attendance-sheet/summary?month=${month}`)
      setSummary(data)
    } catch { toast.error('Failed to load summary') }
  }
  useEffect(() => {
    if (tab === 'summary') loadSummary()
  }, [tab, month])

  /* ── toggle cell ──────────────────────────────────────────────────── */
  const toggle = (date, enroll) => {
    setGrid(g => {
      const cur = g[date]?.[enroll] || 'A'
      const nxt = cycleStatus(cur)
      return { ...g, [date]: { ...g[date], [enroll]: nxt } }
    })
    setDirtyDates(d => new Set([...d, date]))
  }

  /* ── bulk mark ────────────────────────────────────────────────────── */
  const markAll = (date, status) => {
    setGrid(g => {
      const updated = {}
      for (const s of students) updated[s.enrollmentNumber] = status
      return { ...g, [date]: { ...g[date], ...updated } }
    })
    setDirtyDates(d => new Set([...d, date]))
  }

  /* ── save date ────────────────────────────────────────────────────── */
  const saveDate = async (date) => {
    setSaving(date)
    try {
      const records = students.map(s => ({
        enrollmentNumber: s.enrollmentNumber,
        name:             s.name,
        status:           grid[date]?.[s.enrollmentNumber] || 'A',
      }))
      await API.post('/attendance-sheet', { date, records })
      setDirtyDates(d => { const n = new Set(d); n.delete(date); return n })
      toast.success(`Saved ${fmtDateFull(date)}`)
    } catch { toast.error('Save failed') }
    finally { setSaving(null) }
  }

  /* ── add new date ─────────────────────────────────────────────────── */
  const addDate = () => {
    if (!addDateVal) return toast.error('Pick a date')
    if (dates.includes(addDateVal)) return toast.error('Date already exists')
    const newGrid = {}
    for (const s of students) newGrid[s.enrollmentNumber] = 'P'
    setGrid(g => ({ ...g, [addDateVal]: newGrid }))
    setDates(d => [...d, addDateVal].sort())
    setDirtyDates(d => new Set([...d, addDateVal]))
    setShowAddDate(false)
    toast.success(`Added ${fmtDateFull(addDateVal)} — mark attendance then save`)
    setTimeout(() => {
      document.getElementById(`col-${addDateVal}`)?.scrollIntoView({ behavior:'smooth', inline:'nearest' })
    }, 100)
  }

  /* ── delete date ──────────────────────────────────────────────────── */
  const deleteDate = async (date) => {
    if (!confirm(`Delete attendance for ${fmtDateFull(date)}?`)) return
    try {
      await API.delete(`/attendance-sheet/${date}`)
      setDates(d => d.filter(x => x !== date))
      setGrid(g => { const n = { ...g }; delete n[date]; return n })
      toast.success('Date removed')
    } catch { toast.error('Delete failed') }
  }

  /* ── export CSV ───────────────────────────────────────────────────── */
  const exportCSV = () => {
    if (!summary) return toast.error('Load Summary tab first')
    const header = ['Enrollment', 'Name', ...summary.workingDays, 'Present', 'Working Days', 'Percentage', 'Eligible']
    const rows = summary.data.map(s => [
      s.enrollmentNumber,
      s.name,
      ...summary.workingDays.map(d => s.perDate?.[d] || 'A'),
      s.presentDays,
      s.totalWorking,
      s.percentage + '%',
      s.isEligible ? 'YES' : 'NO',
    ])
    const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type:'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `attendance_${faculty?.subject?.replace(/\s+/g,'_')}_${month}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
    toast.success('CSV exported!')
  }

  /* ── stats for a date ─────────────────────────────────────────────── */
  const dateStats = (date) => {
    const rec = grid[date] || {}
    const p = Object.values(rec).filter(v => v === 'P').length
    const a = Object.values(rec).filter(v => v === 'A').length
    const l = Object.values(rec).filter(v => v === 'L').length
    return { p, a, l }
  }

  /* ── per-student totals for sheet view ───────────────────────────── */
  const studentTotals = (enroll) => {
    let p = 0, a = 0, l = 0, working = 0
    for (const date of dates) {
      const st = grid[date]?.[enroll]
      const hasPA = Object.values(grid[date] || {}).some(v => v === 'P' || v === 'A')
      if (hasPA) {
        working++
        if (st === 'P') p++
        else if (st === 'A') a++
        else if (st === 'L') l++
        else a++ // default absent
      }
    }
    const pct = working > 0 ? ((p / working) * 100).toFixed(1) : 0
    return { p, a, l, working, pct: parseFloat(pct) }
  }

  /* ─── styles ────────────────────────────────────────────────────── */
  const baseStyle = {
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    background: C.bg,
    color: C.text,
    minHeight: '100vh',
  }
  const cellBtn = {
    width: 34, height: 28,
    borderRadius: 6, border: '1px solid',
    fontSize: 11, fontWeight: 800,
    cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.1s', fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: '0.04em',
  }
  const th = {
    position: 'sticky', top: 0, zIndex: 10,
    background: C.panel,
    padding: '0 6px', borderBottom: `2px solid ${C.border}`,
    fontSize: 10, fontWeight: 700, color: C.sub,
    letterSpacing: '0.06em', textTransform: 'uppercase',
    whiteSpace: 'nowrap', height: 38,
  }
  const frozenTh = { ...th, left: 0, zIndex: 20, minWidth: 160, borderRight: `1px solid ${C.borderL}` }
  const frozenTd = {
    position: 'sticky', left: 0, zIndex: 5,
    background: C.surface,
    padding: '0 10px', borderRight: `1px solid ${C.borderL}`,
    borderBottom: `1px solid ${C.border}`,
    minWidth: 160, height: 38,
  }
  const td = {
    padding: '0 4px', textAlign: 'center',
    borderBottom: `1px solid ${C.border}`,
    height: 38,
  }

  if (loading) return (
    <div style={{ ...baseStyle, display:'flex', alignItems:'center', justifyContent:'center', height:'80vh' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:48, height:48, border:`3px solid ${C.border}`, borderTop:`3px solid ${C.accent}`, borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ color:C.sub, fontSize:13 }}>Loading attendance…</div>
      </div>
    </div>
  )

  return (
    <div style={baseStyle}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&family=Syne:wght@700;800;900&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        .att-cell:hover{transform:scale(1.15);z-index:10}
        .att-row:hover .att-frozen{background:#1e2538!important}
        .att-row:hover td{background:rgba(124,92,252,0.04)}
        ::-webkit-scrollbar{width:6px;height:6px}
        ::-webkit-scrollbar-track{background:${C.bg}}
        ::-webkit-scrollbar-thumb{background:${C.muted};border-radius:3px}
        .tab-btn{padding:8px 20px;border:none;border-radius:8px;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;letter-spacing:0.04em;transition:all 0.2s}
        .bulk-btn{padding:4px 10px;border-radius:5px;border:1px solid;cursor:pointer;font-size:10px;font-weight:700;font-family:'JetBrains Mono',monospace;transition:all 0.15s}
        .bulk-btn:hover{opacity:0.8}
      `}</style>

      {/* ── HEADER ── */}
      <div style={{
        background: `linear-gradient(135deg, ${C.surface} 0%, #1a1f35 100%)`,
        borderBottom: `1px solid ${C.border}`,
        padding: '20px 28px',
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
          <div>
            <div style={{ fontSize:22, fontWeight:900, fontFamily:"'Syne',sans-serif", letterSpacing:'-0.02em', color:C.text }}>
              Attendance Sheet
            </div>
            {faculty && (
              <div style={{ fontSize:11, color:C.sub, marginTop:4, display:'flex', gap:10 }}>
                <span style={{ color:C.accent, fontWeight:700 }}>{faculty.subject}</span>
                {faculty.subjectCode && <span style={{ background:C.accentL, color:C.accent, padding:'1px 8px', borderRadius:4 }}>{faculty.subjectCode}</span>}
                <span>·</span>
                <span>{students.length} students</span>
                <span>·</span>
                <span>{dates.length} dates recorded</span>
              </div>
            )}
          </div>

          {/* Month nav */}
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <button onClick={() => setMonth(prevMonth(month))}
              style={{ width:32, height:32, borderRadius:8, background:C.panel, border:`1px solid ${C.border}`, color:C.sub, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <ChevronLeft size={14} />
            </button>
            <div style={{ padding:'6px 16px', background:C.panel, border:`1px solid ${C.border}`, borderRadius:8, fontSize:12, fontWeight:700, color:C.text, minWidth:140, textAlign:'center' }}>
              {monthLabel(month)}
            </div>
            <button onClick={() => setMonth(nextMonth(month))}
              style={{ width:32, height:32, borderRadius:8, background:C.panel, border:`1px solid ${C.border}`, color:C.sub, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Actions */}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setShowAddDate(true)}
              style={{ padding:'8px 16px', borderRadius:8, background:C.accent, border:'none', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', gap:6, fontFamily:"'JetBrains Mono',monospace" }}>
              <Plus size={13} /> Add Date
            </button>
            <button onClick={exportCSV}
              style={{ padding:'8px 14px', borderRadius:8, background:C.panel, border:`1px solid ${C.border}`, color:C.sub, cursor:'pointer', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', gap:6, fontFamily:"'JetBrains Mono',monospace" }}>
              <Download size={13} /> Export CSV
            </button>
            <button onClick={loadData}
              style={{ width:34, height:34, borderRadius:8, background:C.panel, border:`1px solid ${C.border}`, color:C.sub, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:6, marginTop:16 }}>
          {[['sheet','📋 Attendance Sheet'],['summary','📊 Eligibility Summary']].map(([key, label]) => (
            <button key={key} className="tab-btn"
              onClick={() => setTab(key)}
              style={{
                background: tab === key ? C.accent : C.panel,
                color: tab === key ? '#fff' : C.sub,
                border: `1px solid ${tab === key ? C.accent : C.border}`,
                boxShadow: tab === key ? `0 4px 12px rgba(124,92,252,0.3)` : 'none',
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── ADD DATE MODAL ── */}
      {showAddDate && (
  <div style={{
    position:'fixed', inset:0, background:'rgba(0,0,0,0.45)',
    // backdropFilter:'blur(4px)', 
    display:'flex', alignItems:'center',
    justifyContent:'center', zIndex:2000,overflowY:'auto'
  }}>
    <div style={{
      width:320, background:C.panel, border:`1px solid ${C.border}`,
      borderRadius:12, padding:20, boxShadow:'0 8px 30px rgba(0,0,0,0.2)'
    }}>
      <div style={{
        fontSize:18, fontWeight:800, marginBottom:14,
        color:C.text, fontFamily:"'Syne',sans-serif"
      }}>Add Date</div>

      <input
        type="date"
        value={newDate}
        onChange={e => setNewDate(e.target.value)}
        style={{
          width:'100%', padding:'10px 12px', borderRadius:8,
          border:`1px solid ${C.border}`, background:C.surface,
          color:C.text, fontSize:13, marginBottom:18
        }}
      />

      <div style={{ display:'flex', gap:10 }}>
        <button onClick={() => setShowAddDate(false)}
          style={{
            flex:1, padding:'9px 0', borderRadius:8,
            background:C.surface, border:`1px solid ${C.border}`,
            color:C.sub, cursor:'pointer', fontSize:12, fontWeight:700
          }}>Cancel</button>

        <button onClick={addDate}
          style={{
            flex:1, padding:'9px 0', borderRadius:8,
            background:C.accent, border:'none',
            color:'#fff', cursor:'pointer',
            fontSize:12, fontWeight:700
          }}>Add Date</button>
      </div>

      <div style={{
        marginTop:12, fontSize:10, color:C.muted, lineHeight:1.5
      }}>
        All students will default to 
        <span style={{ color:C.green, fontWeight:700 }}> P (Present)</span>.
      </div>
    </div>
  </div>
)}

      {/* ════════════════ SHEET TAB ════════════════ */}
      {tab === 'sheet' && (
        <div style={{ padding:'16px 0 0' }}>
          {dates.length === 0 ? (
            <div style={{ textAlign:'center', padding:'80px 20px', color:C.muted }}>
              <Calendar size={48} style={{ margin:'0 auto 16px', opacity:0.3 }} />
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:18, color:C.sub, marginBottom:8 }}>
                No attendance recorded for {monthLabel(month)}
              </div>
              <div style={{ fontSize:12, marginBottom:20 }}>Click "Add Date" to start marking attendance</div>
              <button onClick={() => setShowAddDate(true)}
                style={{ padding:'10px 24px', borderRadius:8, background:C.accent, border:'none', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:"'JetBrains Mono',monospace" }}>
                <Plus size={14} style={{ display:'inline', verticalAlign:'middle', marginRight:6 }} />Add First Date
              </button>
            </div>
          ) : (
            <div style={{ overflowX:'auto', overflowY:'auto', maxHeight:'calc(100vh - 260px)' }} ref={tableRef}>
              <table style={{ borderCollapse:'collapse', tableLayout:'fixed' }}>
                <thead>
                  <tr>
                    {/* Frozen header: Enrollment + Name */}
                    <th style={{ ...frozenTh, width:52 }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <span>#</span>
                      </div>
                    </th>
                    <th style={{ ...frozenTh, minWidth:200, left:52 }}>
                      Student
                    </th>

                    {/* Date columns */}
                    {dates.map(date => {
                      const stats = dateStats(date)
                      const isDirty = dirtyDates.has(date)
                      return (
                        <th key={date} id={`col-${date}`} style={{ ...th, minWidth:52, padding:0, position:'sticky', top:0 }}>
                          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'4px 2px', gap:2 }}>
                            <div style={{ fontSize:9, color: isDirty ? C.amber : C.muted, fontWeight:700 }}>{fmtDate(date)}</div>
                            <div style={{ display:'flex', gap:2 }}>
                              <span style={{ fontSize:8, color:C.green }}>{stats.p}P</span>
                              <span style={{ fontSize:8, color:C.red }}>{stats.a}A</span>
                            </div>
                          </div>
                        </th>
                      )
                    })}

                    {/* Totals */}
                    <th style={{ ...th, minWidth:56, background:C.panel, borderLeft:`1px solid ${C.borderL}`, position:'sticky', top:0 }}>P</th>
                    <th style={{ ...th, minWidth:56, background:C.panel }}>W.Days</th>
                    <th style={{ ...th, minWidth:68, background:C.panel }}>%</th>
                    <th style={{ ...th, minWidth:72, background:C.panel }}>Status</th>
                  </tr>

                  {/* Bulk mark row */}
                  <tr style={{ background: C.bg }}>
                    <td colSpan={2} style={{ ...frozenTd, fontSize:9, color:C.muted, fontWeight:700, letterSpacing:'0.05em', left:0, width:252 }}>
                      BULK MARK →
                    </td>
                    {dates.map(date => (
                      <td key={date} style={{ ...td, background:C.bg, padding:'3px 2px' }}>
                        <div style={{ display:'flex', flexDirection:'column', gap:2, alignItems:'center' }}>
                          <button className="bulk-btn"
                            onClick={() => markAll(date, 'P')}
                            style={{ background:C.greenL, color:C.green, border:`1px solid rgba(34,197,94,0.25)`, width:32 }}>
                            ALL P
                          </button>
                          <button className="bulk-btn"
                            onClick={() => markAll(date, 'A')}
                            style={{ background:C.redL, color:C.red, border:`1px solid rgba(239,68,68,0.25)`, width:32 }}>
                            ALL A
                          </button>
                        </div>
                      </td>
                    ))}
                    <td colSpan={4} style={{ ...td, background:C.bg }} />
                  </tr>
                </thead>

                <tbody>
                  {students.map((s, idx) => {
                    const tots = studentTotals(s.enrollmentNumber)
                    const eligible = tots.pct >= 75
                    const pctColor = tots.pct >= 75 ? C.green : tots.pct >= 60 ? C.amber : C.red
                    return (
                      <tr key={s.enrollmentNumber} className="att-row">
                        {/* Index */}
                        <td style={{ ...frozenTd, width:52, fontSize:10, color:C.muted, textAlign:'center' }}>{idx + 1}</td>
                        {/* Student info */}
                        <td style={{ ...frozenTd, left:52, minWidth:200 }} className="att-frozen">
                          <div>
                            <div style={{ fontSize:11, fontWeight:700, color:C.text, letterSpacing:'0.02em' }}>
                              {s.enrollmentNumber.slice(-6)}
                            </div>
                            <div style={{ fontSize:10, color:C.sub, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:140 }}>
                              {s.name}
                            </div>
                          </div>
                        </td>

                        {/* Attendance cells */}
                        {dates.map(date => {
                          const st = grid[date]?.[s.enrollmentNumber] || 'A'
                          const sty = statusStyle(st)
                          return (
                            <td key={date} style={td}>
                              <button
                                className="att-cell"
                                onClick={() => toggle(date, s.enrollmentNumber)}
                                style={{ ...cellBtn, background:sty.bg, color:sty.color, borderColor:sty.border }}
                                title={`${s.name} — ${date}: click to toggle`}
                              >
                                {sty.label}
                              </button>
                            </td>
                          )
                        })}

                        {/* Totals */}
                        <td style={{ ...td, borderLeft:`1px solid ${C.borderL}`, fontSize:12, fontWeight:800, color:C.green }}>{tots.p}</td>
                        <td style={{ ...td, fontSize:11, color:C.sub }}>{tots.working}</td>
                        <td style={{ ...td }}>
                          <span style={{ fontSize:12, fontWeight:800, color:pctColor }}>{tots.pct}%</span>
                        </td>
                        <td style={{ ...td }}>
                          {eligible
                            ? <span style={{ fontSize:9, fontWeight:800, color:C.green, background:C.greenL, padding:'2px 8px', borderRadius:4, border:`1px solid rgba(34,197,94,0.25)` }}>ELIGIBLE</span>
                            : <span style={{ fontSize:9, fontWeight:800, color:C.red, background:C.redL, padding:'2px 8px', borderRadius:4, border:`1px solid rgba(239,68,68,0.25)` }}>SHORT</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Per-date save buttons ── */}
          {dates.length > 0 && (
            <div style={{ padding:'12px 20px', background:C.surface, borderTop:`1px solid ${C.border}`, display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
              <span style={{ fontSize:10, fontWeight:700, color:C.sub, letterSpacing:'0.06em', textTransform:'uppercase', marginRight:4 }}>Save:</span>
              {dates.map(date => {
                const dirty = dirtyDates.has(date)
                const isSaving = saving === date
                return (
                  <div key={date} style={{ display:'flex', gap:4, alignItems:'center' }}>
                    <button
                      onClick={() => saveDate(date)}
                      disabled={!dirty || !!saving}
                      style={{
                        padding:'5px 10px', borderRadius:6,
                        background: dirty ? C.accent : C.panel,
                        border: `1px solid ${dirty ? C.accent : C.border}`,
                        color: dirty ? '#fff' : C.muted,
                        cursor: dirty ? 'pointer' : 'default',
                        fontSize:10, fontWeight:700,
                        fontFamily:"'JetBrains Mono',monospace",
                        display:'flex', alignItems:'center', gap:4,
                        opacity: !dirty ? 0.5 : 1,
                      }}
                    >
                      {isSaving
                        ? <RefreshCw size={10} style={{ animation:'spin 0.6s linear infinite' }} />
                        : <Save size={10} />}
                      {fmtDate(date)}
                      {dirty && <span style={{ width:5, height:5, borderRadius:'50%', background:'#fbbf24', display:'inline-block' }} />}
                    </button>
                    <button
                      onClick={() => deleteDate(date)}
                      style={{ width:22, height:22, borderRadius:5, background:'none', border:`1px solid ${C.border}`, color:C.muted, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
                      title="Delete this date">
                      <Trash2 size={10} />
                    </button>
                  </div>
                )
              })}
              {dirtyDates.size > 0 && (
                <button
                  onClick={async () => { for (const d of dates) { if (dirtyDates.has(d)) await saveDate(d) } }}
                  disabled={!!saving}
                  style={{ marginLeft:'auto', padding:'6px 16px', borderRadius:6, background:C.green, border:'none', color:'#fff', cursor:'pointer', fontSize:11, fontWeight:800, fontFamily:"'JetBrains Mono',monospace", display:'flex', alignItems:'center', gap:5 }}>
                  <Save size={11} /> Save All ({dirtyDates.size})
                </button>
              )}
            </div>
          )}

          {/* Legend */}
          <div style={{ padding:'8px 20px', display:'flex', gap:16, fontSize:10, color:C.muted }}>
            {[['P','Present',C.green],['A','Absent',C.red],['L','Leave/Holiday',C.amber]].map(([code, label, color]) => (
              <span key={code} style={{ display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ width:18, height:14, borderRadius:3, background:`${color}20`, border:`1px solid ${color}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800, color }}>{code}</span>
                {label}
              </span>
            ))}
            <span style={{ marginLeft:4 }}>· Click cell to toggle P→A→L→P</span>
            <span style={{ color:C.amber }}>· 🟡 dot = unsaved changes</span>
          </div>
        </div>
      )}

      {/* ════════════════ SUMMARY TAB ════════════════ */}
      {tab === 'summary' && (
        <div style={{ padding:20 }}>
          {!summary ? (
            <div style={{ textAlign:'center', padding:60, color:C.muted }}>
              <RefreshCw size={32} style={{ margin:'0 auto 12px', opacity:0.3, animation:'spin 1s linear infinite' }} />
              Loading summary…
            </div>
          ) : (
            <>
              {/* Stats row */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:20 }}>
                {[
                  { label:'Working Days',  value: summary.totalWorkingDays,  color:C.accent  },
                  { label:'Total Students',value: summary.data.length,        color:C.blue    },
                  { label:'Eligible (≥75%)',value: summary.data.filter(s=>s.isEligible).length, color:C.green },
                  { label:'Not Eligible',  value: summary.data.filter(s=>!s.isEligible).length, color:C.red   },
                  { label:'Avg Attendance',value: summary.data.length ? (summary.data.reduce((a,s)=>a+s.percentage,0)/summary.data.length).toFixed(1)+'%' : '—', color:C.amber },
                ].map(item => (
                  <div key={item.label} style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:12, padding:'14px 16px', borderTop:`3px solid ${item.color}` }}>
                    <div style={{ fontSize:22, fontWeight:900, color:item.color, fontFamily:"'Syne',sans-serif" }}>{item.value}</div>
                    <div style={{ fontSize:10, color:C.sub, marginTop:4, fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase' }}>{item.label}</div>
                  </div>
                ))}
              </div>

              {/* Working-day note */}
              <div style={{
                padding:'10px 14px', background:C.accentL, border:`1px solid rgba(124,92,252,0.25)`,
                borderRadius:8, marginBottom:16, fontSize:11, color:C.accent, display:'flex', gap:8, alignItems:'flex-start',
              }}>
                <AlertTriangle size={13} style={{ flexShrink:0, marginTop:1 }} />
                <span><strong>Working Day Logic:</strong> A date is counted as a working day only if at least 1 student is marked P or A on that date. "L" (Leave/Holiday) dates are excluded. Eligibility = Present Days ÷ Working Days × 100</span>
              </div>

              {/* Summary table */}
              <div style={{ overflowX:'auto', background:C.panel, borderRadius:12, border:`1px solid ${C.border}` }}>
                <table style={{ borderCollapse:'collapse', width:'100%' }}>
                  <thead>
                    <tr style={{ background:C.surface }}>
                      <th style={{ ...th, position:'sticky', left:0, background:C.surface, zIndex:10, minWidth:46, borderRight:`1px solid ${C.borderL}`, textAlign:'center' }}>#</th>
                      <th style={{ ...th, position:'sticky', left:46, background:C.surface, zIndex:10, minWidth:190, borderRight:`1px solid ${C.borderL}` }}>Student</th>
                      {summary.workingDays.map(d => (
                        <th key={d} style={{ ...th, minWidth:44, fontSize:9 }}>
                          <div style={{ fontSize:8 }}>{fmtDate(d)}</div>
                        </th>
                      ))}
                      <th style={{ ...th, minWidth:52, borderLeft:`1px solid ${C.borderL}`, color:C.green }}>P</th>
                      <th style={{ ...th, minWidth:52, color:C.red }}>A</th>
                      <th style={{ ...th, minWidth:64 }}>W.Days</th>
                      <th style={{ ...th, minWidth:70 }}>%</th>
                      <th style={{ ...th, minWidth:82 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.data.map((s, i) => {
                      const pctColor = s.percentage >= 75 ? C.green : s.percentage >= 60 ? C.amber : C.red
                      return (
                        <tr key={s.enrollmentNumber} className="att-row">
                          <td style={{ ...td, position:'sticky', left:0, zIndex:5, background:C.panel, borderRight:`1px solid ${C.borderL}`, fontSize:10, color:C.muted, textAlign:'center' }}>{i+1}</td>
                          <td style={{ ...td, position:'sticky', left:46, zIndex:5, background:C.panel, borderRight:`1px solid ${C.borderL}`, textAlign:'left', padding:'0 10px' }}>
                            <div style={{ fontSize:11, fontWeight:700, color:C.text }}>{s.enrollmentNumber.slice(-6)}</div>
                            <div style={{ fontSize:10, color:C.sub, maxWidth:150, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.name}</div>
                          </td>
                          {summary.workingDays.map(d => {
                            const st = s.perDate?.[d] || 'A'
                            const sty = statusStyle(st)
                            return (
                              <td key={d} style={td}>
                                <span style={{ fontSize:10, fontWeight:800, color:sty.color }}>{sty.label}</span>
                              </td>
                            )
                          })}
                          <td style={{ ...td, borderLeft:`1px solid ${C.borderL}`, fontWeight:800, color:C.green, fontSize:12 }}>{s.presentDays}</td>
                          <td style={{ ...td, fontWeight:800, color:C.red, fontSize:12 }}>{s.totalWorking - s.presentDays}</td>
                          <td style={{ ...td, color:C.sub, fontSize:11 }}>{s.totalWorking}</td>
                          <td style={{ ...td }}>
                            <span style={{ fontWeight:900, fontSize:13, color:pctColor, fontFamily:"'Syne',sans-serif" }}>{s.percentage}%</span>
                          </td>
                          <td style={{ ...td }}>
                            {s.isEligible
                              ? <span style={{ fontSize:9, fontWeight:800, color:C.green, background:C.greenL, padding:'3px 10px', borderRadius:5, border:`1px solid rgba(34,197,94,0.3)`, display:'inline-flex', alignItems:'center', gap:3 }}>
                                  <CheckCircle size={9} /> ELIGIBLE
                                </span>
                              : <span style={{ fontSize:9, fontWeight:800, color:C.red, background:C.redL, padding:'3px 10px', borderRadius:5, border:`1px solid rgba(239,68,68,0.3)`, display:'inline-flex', alignItems:'center', gap:3 }}>
                                  <XCircle size={9} /> SHORT
                                </span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop:12, display:'flex', justifyContent:'flex-end' }}>
                <button onClick={exportCSV}
                  style={{ padding:'9px 20px', borderRadius:8, background:C.accent, border:'none', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", display:'flex', alignItems:'center', gap:6 }}>
                  <Download size={13} /> Export Full CSV
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}