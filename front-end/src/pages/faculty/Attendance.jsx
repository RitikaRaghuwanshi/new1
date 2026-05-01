import React, { useEffect, useState, useCallback } from 'react'
import { API } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { ChevronLeft, ChevronRight, Plus, Download, RefreshCw, Save, CheckCircle, XCircle, Info, Sliders, BookOpen } from 'lucide-react'

const fmtMonth = (d) => d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
const fmtDate  = (iso) => { const [,m,d] = iso.split('-'); return `${d}/${m}` }
const STATUS_COLORS = { P: 'var(--green)', A: 'var(--red)', L: 'var(--amber)', H: '#6366f1' }
const STATUS_CYCLE  = ['P','A','L','H']

const getEnrollSuffix = (e='') => { const m=e.match(/(\d+)$/); return m?parseInt(m[1],10):9999 }
const sortByRollNo = (arr) => [...arr].sort((a,b)=>{
  const na=getEnrollSuffix(a.enrollmentNumber), nb=getEnrollSuffix(b.enrollmentNumber)
  if(na<=80&&nb<=80) return na-nb
  if(na<=80) return -1
  if(nb<=80) return 1
  return na-nb
})

function EligibilityCriteriaPanel({ subjectCode, criteria, onChange, onSave, saving }) {
  return (
    <div className="card" style={{padding:0,border:'1px solid rgba(124,58,237,0.2)',overflow:'hidden'}}>
      <div style={{padding:'14px 18px',borderBottom:'1px solid var(--border)',background:'var(--accent-glow-lg)',display:'flex',alignItems:'center',gap:8}}>
        <Sliders size={15} color="var(--accent)"/>
        <span style={{fontFamily:'var(--font-display)',fontWeight:700,fontSize:'0.875rem',color:'var(--accent)'}}>Eligibility Criteria</span>
        {subjectCode&&<span style={{marginLeft:'auto',fontSize:'0.7rem',fontFamily:'monospace',background:'rgba(124,58,237,0.12)',color:'var(--accent)',padding:'2px 8px',borderRadius:6}}>{subjectCode}</span>}
      </div>
      <div style={{padding:'16px 18px'}}>
        <div style={{paddingBottom:14,marginBottom:14,borderBottom:'1px solid var(--border)'}}>
          <div style={{fontSize:'0.72rem',fontFamily:'var(--font-display)',fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:10}}>Minimum Attendance %</div>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
            <input type="range" min="1" max="100" value={criteria.minPercentage}
              onChange={e=>onChange({...criteria,minPercentage:parseInt(e.target.value)})}
              style={{flex:1,accentColor:'var(--accent)',cursor:'pointer'}}/>
            <div style={{minWidth:54,padding:'5px 10px',background:'var(--accent)',color:'#fff',borderRadius:8,fontFamily:'var(--font-display)',fontWeight:800,fontSize:'0.95rem',textAlign:'center'}}>{criteria.minPercentage}%</div>
          </div>
          <div style={{display:'flex',gap:6}}>
            {[{label:'60%',value:60,note:'Lenient'},{label:'75%',value:75,note:'Standard'},{label:'80%',value:80,note:'Strict'},{label:'85%',value:85,note:'Very Strict'}].map(p=>(
              <button key={p.value} onClick={()=>onChange({...criteria,minPercentage:p.value})}
                style={{flex:1,padding:'5px 4px',borderRadius:7,border:criteria.minPercentage===p.value?'1.5px solid var(--accent)':'1px solid var(--border)',background:criteria.minPercentage===p.value?'var(--accent-glow)':'var(--bg-elevated)',color:criteria.minPercentage===p.value?'var(--accent)':'var(--text-secondary)',fontSize:'0.72rem',fontFamily:'var(--font-display)',fontWeight:700,cursor:'pointer'}}>
                {p.label}<div style={{fontSize:'0.6rem',marginTop:1}}>{p.note}</div>
              </button>
            ))}
          </div>
        </div>
        <div style={{padding:'10px 12px',background:'var(--bg-elevated)',borderRadius:8,border:'1px solid var(--border)',fontSize:'0.75rem',color:'var(--text-muted)',marginBottom:14}}>
          <span style={{fontWeight:700,color:'var(--text-secondary)'}}>Formula: </span>
          Eligible = (Present ÷ Working Days × 100) ≥ <strong style={{color:'var(--accent)'}}>{criteria.minPercentage}%</strong>
        </div>
        <button onClick={onSave} disabled={saving} className="btn btn-primary" style={{width:'100%',justifyContent:'center',padding:'10px'}}>
          {saving?<><div className="spinner" style={{width:14,height:14}}/> Saving…</>:<><Save size={14}/> Save Criteria</>}
        </button>
      </div>
    </div>
  )
}

export default function Attendance() {
  const [profile,      setProfile]      = useState(null)
  const [students,     setStudents]     = useState([])
  const [attendance,   setAttendance]   = useState({})
  const [dates,        setDates]        = useState([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [activeTab,    setActiveTab]    = useState('sheet')
  const [criteria,     setCriteria]     = useState({minPercentage:75})
  const [savingCriteria,setSavingCriteria]=useState(false)
  const [addingDate,   setAddingDate]   = useState(false)
  const [newDate,      setNewDate]      = useState('')
  const [dayAttendance,setDayAttendance]= useState({})

  useEffect(()=>{
    API.get('/faculty/profile')
      .then(r=>setProfile(r.data.data))
      .catch(()=>toast.error('Could not load profile'))
  },[])

  const loadData = useCallback(async()=>{
    if(!profile) return
    setLoading(true)
    try {
      const month=`${currentMonth.getFullYear()}-${String(currentMonth.getMonth()+1).padStart(2,'0')}`
      const [studRes,attRes] = await Promise.all([
        API.get('/attendance-sheet/students'),
        API.get(`/attendance-sheet?month=${month}`),
      ])
      setStudents(sortByRollNo(studRes.data.data||[]))
      const docs=attRes.data.data||[]
      const map={}, datesSet=new Set()
      docs.forEach(doc=>{
        if(!doc.date) return
        datesSet.add(doc.date)
        ;(doc.records||[]).forEach(r=>{
          if(!map[r.enrollmentNumber]) map[r.enrollmentNumber]={}
          map[r.enrollmentNumber][doc.date]=r.status
        })
      })
      setDates([...datesSet].sort())
      setAttendance(map)
    } catch(err){ toast.error('Failed to load attendance') }
    finally{ setLoading(false) }
  },[profile,currentMonth])

  useEffect(()=>{ loadData() },[loadData])

  const workingDays = dates.filter(date=>
    students.some(s=>{ const st=attendance?.[s.enrollmentNumber]?.[date]; return st==='P'||st==='A' })
  ).length

  const calcStats = (enrollmentNumber)=>{
    let present=0,absent=0,wDays=0
    dates.forEach(date=>{
      const isWorking=students.some(x=>{ const xs=attendance?.[x.enrollmentNumber]?.[date]; return xs==='P'||xs==='A' })
      if(!isWorking) return
      wDays++
      const st=attendance?.[enrollmentNumber]?.[date]||'A'
      if(st==='P') present++
      if(st==='A') absent++
    })
    const pct=wDays>0?Math.round((present/wDays)*100):0
    return{present,absent,wDays,pct,eligible:pct>=criteria.minPercentage}
  }

  const toggleCell=(enrollmentNumber,date)=>{
    setAttendance(prev=>{
      const current=prev?.[enrollmentNumber]?.[date]||'A'
      const next=STATUS_CYCLE[(STATUS_CYCLE.indexOf(current)+1)%STATUS_CYCLE.length]
      return{...prev,[enrollmentNumber]:{...(prev[enrollmentNumber]||{}),[date]:next}}
    })
  }

  const bulkMarkColumn=(date,status)=>{
    setAttendance(prev=>{
      const updated={...prev}
      students.forEach(s=>{ updated[s.enrollmentNumber]={...(updated[s.enrollmentNumber]||{}),[date]:status} })
      return updated
    })
  }

  const saveAttendance=async()=>{
    if(!dates.length) return toast.error('No dates to save')
    setSaving(true)
    const snapshot=JSON.parse(JSON.stringify(attendance))
    try {
      await Promise.all(dates.map(date=>{
        const records=students.map(s=>({
          enrollmentNumber:s.enrollmentNumber,
          name:s.name||'',
          status:attendance?.[s.enrollmentNumber]?.[date]||'A',
        }))
        return API.post('/attendance-sheet',{date,records})
      }))
      toast.success('Attendance saved!')
    } catch(err){
      setAttendance(snapshot)
      toast.error(err?.response?.data?.message||'Save failed')
    } finally{ setSaving(false) }
  }

  const startAddDate=()=>{
    const today=new Date().toISOString().split('T')[0]
    setNewDate(today)
    const initial={}
    students.forEach(s=>{ initial[s.enrollmentNumber]='P' })
    setDayAttendance(initial)
    setAddingDate(true)
  }

  const saveNewDate=async()=>{
    if(!newDate) return toast.error('Select a date')
    setSaving(true)
    try {
      const records=students.map(s=>({
        enrollmentNumber:s.enrollmentNumber,
        name:s.name||'',
        status:dayAttendance[s.enrollmentNumber]||'A',
      }))
      await API.post('/attendance-sheet',{date:newDate,records})
      setDates(prev=>prev.includes(newDate)?prev:[...prev,newDate].sort())
      setAttendance(prev=>{
        const updated={...prev}
        students.forEach(s=>{
          updated[s.enrollmentNumber]={...(updated[s.enrollmentNumber]||{}),[newDate]:dayAttendance[s.enrollmentNumber]||'A'}
        })
        return updated
      })
      toast.success('Attendance saved!')
      setAddingDate(false)
    } catch(err){ toast.error(err?.response?.data?.message||'Save failed') }
    finally{ setSaving(false) }
  }

  const bulkMarkModal=(status)=>{
    const updated={}
    students.forEach(s=>{ updated[s.enrollmentNumber]=status })
    setDayAttendance(updated)
  }

  const saveCriteria=()=>{
    setSavingCriteria(true)
    setTimeout(()=>{ setSavingCriteria(false); toast.success('Criteria updated!') },300)
  }

  // ── Export: ALL dates in one CSV (attendance register format) ──
  const exportCSV=()=>{
    const headers=['#','Enrollment','Name',...dates.map(fmtDate),'P','A','W.Days','%','Status']
    const rows=students.map((s,i)=>{
      const{present,absent,wDays,pct}=calcStats(s.enrollmentNumber)
      const statuses=dates.map(d=>attendance?.[s.enrollmentNumber]?.[d]||'A')
      return[i+1,s.enrollmentNumber,s.name,...statuses,present,absent,wDays,`${pct}%`,pct>=criteria.minPercentage?'ELIGIBLE':'SHORT']
    })
    const csv=[headers,...rows].map(r=>r.join(',')).join('\n')
    const blob=new Blob([csv],{type:'text/csv'})
    const url=URL.createObjectURL(blob)
    const a=document.createElement('a'); a.href=url
    a.download=`attendance_register_${profile?.subjectCode||'export'}_${fmtMonth(currentMonth).replace(' ','_')}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  if(loading&&!profile) return(
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',gap:12}}>
      <div className="spinner"/><span style={{color:'var(--text-muted)'}}>Loading…</span>
    </div>
  )

  const tabs=[
    {id:'sheet',    label:'📋 Attendance Sheet'},
    {id:'register', label:'📖 Register'},
    {id:'eligibility',label:'📊 Eligibility Summary'},
  ]

  return (
    <div className="page-enter" style={{position:'relative'}}>

      {/* Header */}
      <div style={{marginBottom:22}}>
        <h1 style={{fontSize:'1.5rem',fontWeight:800,letterSpacing:'-0.03em'}}>Attendance Sheet</h1>
        {profile&&(
          <div style={{display:'flex',alignItems:'center',gap:8,marginTop:4}}>
            <span style={{color:'var(--accent)',fontFamily:'var(--font-display)',fontWeight:700,fontSize:'0.875rem'}}>{profile.subject}</span>
            {profile.subjectCode&&<span style={{fontFamily:'monospace',fontSize:'0.75rem',background:'var(--bg-hover)',color:'var(--text-secondary)',padding:'2px 8px',borderRadius:6}}>{profile.subjectCode}</span>}
            <span style={{color:'var(--text-muted)',fontSize:'0.8rem'}}>· {students.length} students · {dates.length} dates recorded</span>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20,flexWrap:'wrap'}}>
        <div style={{display:'flex',alignItems:'center',gap:4,background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'4px 6px'}}>
          <button className="btn btn-ghost" style={{padding:'5px 8px'}}
            onClick={()=>{ const d=new Date(currentMonth); d.setMonth(d.getMonth()-1); setCurrentMonth(d) }}>
            <ChevronLeft size={14}/>
          </button>
          <span style={{fontFamily:'var(--font-display)',fontWeight:700,fontSize:'0.875rem',padding:'0 8px',minWidth:130,textAlign:'center'}}>{fmtMonth(currentMonth)}</span>
          <button className="btn btn-ghost" style={{padding:'5px 8px'}}
            onClick={()=>{ const d=new Date(currentMonth); d.setMonth(d.getMonth()+1); setCurrentMonth(d) }}>
            <ChevronRight size={14}/>
          </button>
        </div>
        <div style={{flex:1}}/>
        <button className="btn btn-ghost" onClick={loadData} disabled={loading}>
          <RefreshCw size={14} style={loading?{animation:'spin 0.6s linear infinite'}:{}}/> Refresh
        </button>
        <button className="btn btn-ghost" onClick={exportCSV} disabled={!dates.length}><Download size={14}/> Export CSV</button>
        <button className="btn btn-ghost" onClick={startAddDate}><Plus size={14}/> Add Date</button>
        <button className="btn btn-primary" onClick={saveAttendance} disabled={saving||!dates.length}>
          {saving?<><div className="spinner" style={{width:13,height:13}}/> Saving…</>:<><Save size={14}/> Save</>}
        </button>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:4,marginBottom:20,background:'var(--bg-surface)',padding:4,borderRadius:'var(--radius)',border:'1px solid var(--border)',width:'fit-content'}}>
        {tabs.map(tab=>(
          <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
            style={{padding:'7px 16px',borderRadius:'var(--radius-sm)',border:'none',cursor:'pointer',fontSize:'0.875rem',fontFamily:'var(--font-display)',fontWeight:600,transition:'all 0.15s',background:activeTab===tab.id?'var(--accent)':'transparent',color:activeTab===tab.id?'#fff':'var(--text-secondary)'}}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Add Date Modal */}
      {addingDate&&(
        <div style={{position:'absolute',top:0,left:0,right:0,bottom:0,zIndex:100,background:'rgba(0,0,0,0.55)',display:'flex',alignItems:'flex-start',justifyContent:'center',paddingTop:60,borderRadius:'var(--radius)'}}
          onClick={e=>{ if(e.target===e.currentTarget) setAddingDate(false) }}>
          <div className="card" style={{width:'100%',maxWidth:560,maxHeight:'80vh',overflow:'auto',position:'relative'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
              <h3 style={{fontFamily:'var(--font-display)',fontWeight:800}}>Mark Attendance</h3>
              <button className="btn btn-ghost" onClick={()=>setAddingDate(false)}>✕ Cancel</button>
            </div>
            <div className="form-group" style={{marginBottom:16}}>
              <label className="form-label">Date</label>
              <input type="date" className="form-input" value={newDate} onChange={e=>setNewDate(e.target.value)}/>
            </div>
            <div style={{display:'flex',gap:8,marginBottom:14,alignItems:'center'}}>
              <span style={{fontSize:'0.75rem',color:'var(--text-muted)',fontFamily:'var(--font-display)',fontWeight:700}}>BULK:</span>
              {['P','A','L','H'].map(s=>(
                <button key={s} onClick={()=>bulkMarkModal(s)}
                  style={{padding:'4px 12px',borderRadius:7,border:`1px solid ${STATUS_COLORS[s]}`,background:'transparent',color:STATUS_COLORS[s],fontFamily:'var(--font-display)',fontWeight:700,fontSize:'0.78rem',cursor:'pointer'}}>
                  All {s}
                </button>
              ))}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:20}}>
              {students.map(s=>(
                <div key={s.enrollmentNumber} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',background:dayAttendance[s.enrollmentNumber]==='P'?'var(--green-dim)':dayAttendance[s.enrollmentNumber]==='A'?'var(--red-dim)':'var(--bg-elevated)',borderRadius:'var(--radius)',border:'1px solid var(--border)',transition:'background 0.15s'}}>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:'var(--font-display)',fontWeight:700,fontSize:'0.8rem',color:'var(--accent)'}}>{s.enrollmentNumber}</div>
                    <div style={{fontSize:'0.78rem',color:'var(--text-secondary)'}}>{s.name}</div>
                  </div>
                  <div style={{display:'flex',gap:4}}>
                    {['P','A','L','H'].map(status=>(
                      <button key={status} onClick={()=>setDayAttendance(prev=>({...prev,[s.enrollmentNumber]:status}))}
                        style={{width:32,height:32,borderRadius:7,border:`1.5px solid ${dayAttendance[s.enrollmentNumber]===status?STATUS_COLORS[status]:'var(--border)'}`,background:dayAttendance[s.enrollmentNumber]===status?`${STATUS_COLORS[status]}20`:'transparent',color:dayAttendance[s.enrollmentNumber]===status?STATUS_COLORS[status]:'var(--text-muted)',fontFamily:'var(--font-display)',fontWeight:700,fontSize:'0.78rem',cursor:'pointer',transition:'all 0.12s'}}>
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-primary" onClick={saveNewDate} disabled={saving} style={{width:'100%',justifyContent:'center',padding:12}}>
              {saving?<><div className="spinner" style={{width:14,height:14}}/> Saving…</>:<><Save size={14}/> Save Attendance</>}
            </button>
          </div>
        </div>
      )}

      {/* ── ATTENDANCE SHEET TAB ── */}
      {activeTab==='sheet'&&(
        <>
          {loading?(
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:200,gap:12}}>
              <div className="spinner"/><span style={{color:'var(--text-muted)'}}>Loading…</span>
            </div>
          ):dates.length===0?(
            <div style={{padding:56,textAlign:'center',color:'var(--text-muted)'}}>
              <div style={{fontSize:40,marginBottom:14,opacity:0.2}}>📅</div>
              <div style={{fontFamily:'var(--font-display)',fontWeight:700,marginBottom:6}}>No dates recorded for this month</div>
              <div style={{fontSize:'0.85rem',marginBottom:18}}>Click "+ Add Date" to start marking attendance</div>
              <button className="btn btn-primary" onClick={startAddDate}><Plus size={14}/> Add Today's Date</button>
            </div>
          ):(
            <div className="card" style={{padding:0}}>
              <div style={{padding:'10px 16px',borderBottom:'1px solid var(--border)',fontSize:'0.75rem',color:'var(--text-muted)',display:'flex',alignItems:'center',gap:6}}>
                <Info size={13} color="var(--accent)"/>
                Click any cell to cycle: <strong style={{color:'var(--green)'}}>P</strong> → <strong style={{color:'var(--red)'}}>A</strong> → <strong style={{color:'var(--amber)'}}>L</strong> → <strong style={{color:'#6366f1'}}>H</strong>. Then click <strong>Save</strong>.
              </div>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',minWidth:600}}>
                  <thead>
                    <tr style={{background:'var(--bg-elevated)'}}>
                      <th style={{padding:'10px 16px',textAlign:'left',fontSize:'0.7rem',fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em',borderBottom:'2px solid var(--border)',position:'sticky',left:0,background:'var(--bg-elevated)',zIndex:2,minWidth:220}}>Student</th>
                      {dates.map(date=>(
                        <th key={date} style={{padding:'6px 4px',textAlign:'center',minWidth:60,borderBottom:'2px solid var(--border)',background:'var(--bg-elevated)'}}>
                          <div style={{fontSize:'0.78rem',fontWeight:800,color:'var(--text-primary)',fontFamily:'var(--font-display)'}}>{fmtDate(date)}</div>
                          <div style={{display:'flex',gap:2,justifyContent:'center',marginTop:4}}>
                            <button onClick={()=>bulkMarkColumn(date,'P')} style={{padding:'2px 6px',borderRadius:4,border:'none',cursor:'pointer',fontSize:'0.6rem',fontWeight:700,background:'var(--green-dim)',color:'var(--green)'}}>ALL P</button>
                            <button onClick={()=>bulkMarkColumn(date,'A')} style={{padding:'2px 6px',borderRadius:4,border:'none',cursor:'pointer',fontSize:'0.6rem',fontWeight:700,background:'var(--red-dim)',color:'var(--red)'}}>ALL A</button>
                          </div>
                        </th>
                      ))}
                      {['P','A','W.Days','%','Status'].map(h=>(
                        <th key={h} style={{padding:'10px 10px',textAlign:'center',fontSize:'0.7rem',fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',borderBottom:'2px solid var(--border)',background:'var(--bg-elevated)',minWidth:h==='Status'?80:55}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student,idx)=>{
                      const{present,absent,wDays,pct,eligible}=calcStats(student.enrollmentNumber)
                      return(
                        <tr key={student.enrollmentNumber} style={{borderBottom:'1px solid var(--border)',background:idx%2===0?'var(--bg-surface)':'var(--bg-elevated)'}}>
                          <td style={{padding:'10px 16px',position:'sticky',left:0,background:idx%2===0?'var(--bg-surface)':'var(--bg-elevated)',zIndex:1,borderRight:'1px solid var(--border)'}}>
                            <div style={{fontFamily:'var(--font-display)',fontWeight:700,fontSize:'0.82rem',color:'var(--accent)'}}>{student.enrollmentNumber}</div>
                            <div style={{fontSize:'0.75rem',color:'var(--text-secondary)',marginTop:1}}>{student.name}</div>
                          </td>
                          {dates.map(date=>{
                            const status=attendance?.[student.enrollmentNumber]?.[date]||'A'
                            return(
                              <td key={date} style={{padding:'8px 4px',textAlign:'center'}}>
                                <button onClick={()=>toggleCell(student.enrollmentNumber,date)}
                                  style={{width:34,height:34,borderRadius:8,border:`1.5px solid ${STATUS_COLORS[status]||'var(--border)'}`,cursor:'pointer',fontFamily:'var(--font-display)',fontWeight:800,fontSize:'0.8rem',transition:'all 0.12s',background:`${STATUS_COLORS[status]}18`,color:STATUS_COLORS[status]}}>
                                  {status}
                                </button>
                              </td>
                            )
                          })}
                          <td style={{padding:'8px 10px',textAlign:'center',fontFamily:'var(--font-display)',fontWeight:700,color:'var(--green)'}}>{present}</td>
                          <td style={{padding:'8px 10px',textAlign:'center',fontFamily:'var(--font-display)',fontWeight:700,color:'var(--red)'}}>{absent}</td>
                          <td style={{padding:'8px 10px',textAlign:'center',color:'var(--text-muted)'}}>{wDays}</td>
                          <td style={{padding:'8px 10px',textAlign:'center',fontFamily:'var(--font-display)',fontWeight:800,color:eligible?'var(--green)':pct>=criteria.minPercentage-10?'var(--amber)':'var(--red)'}}>{pct}%</td>
                          <td style={{padding:'8px 10px',textAlign:'center'}}>
                            <span style={{padding:'3px 10px',borderRadius:99,fontSize:'0.7rem',fontWeight:800,fontFamily:'var(--font-display)',background:eligible?'var(--green-dim)':'var(--red-dim)',color:eligible?'var(--green)':'var(--red)'}}>
                              {eligible?'ELIGIBLE':'SHORT'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── REGISTER TAB ── */}
      {activeTab==='register'&&(
        <>
          {dates.length===0?(
            <div style={{padding:56,textAlign:'center',color:'var(--text-muted)'}}>
              <div style={{fontSize:40,marginBottom:14,opacity:0.2}}>📖</div>
              <div style={{fontFamily:'var(--font-display)',fontWeight:700,marginBottom:6}}>No attendance recorded yet</div>
              <button className="btn btn-primary" onClick={startAddDate}><Plus size={14}/> Add Date</button>
            </div>
          ):(
            <div className="card" style={{padding:0}}>
              {/* Register header */}
              <div style={{padding:'14px 18px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <BookOpen size={16} color="var(--accent)"/>
                  <span style={{fontFamily:'var(--font-display)',fontWeight:700,fontSize:'0.95rem'}}>Attendance Register</span>
                  <span style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>— {fmtMonth(currentMonth)} · {workingDays} working days</span>
                </div>
                <button className="btn btn-ghost" onClick={exportCSV} style={{fontSize:'0.8rem'}}>
                  <Download size={13}/> Download Register
                </button>
              </div>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',minWidth:500,fontSize:'0.8rem'}}>
                  <thead>
                    {/* Row 1: date numbers */}
                    <tr style={{background:'var(--bg-elevated)'}}>
                      <th rowSpan={2} style={{padding:'8px 12px',textAlign:'left',fontSize:'0.7rem',fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',borderBottom:'2px solid var(--border)',borderRight:'1px solid var(--border)',position:'sticky',left:0,background:'var(--bg-elevated)',zIndex:2,minWidth:200}}>#&nbsp;&nbsp;Student</th>
                      {dates.map(d=>(
                        <th key={d} style={{padding:'6px 4px',textAlign:'center',minWidth:38,borderBottom:'1px solid var(--border)',borderRight:'1px solid var(--border-light)',background:'var(--bg-elevated)',fontSize:'0.75rem',fontWeight:800,color:'var(--text-primary)',fontFamily:'var(--font-display)'}}>
                          {fmtDate(d)}
                        </th>
                      ))}
                      {['P','A','%','Status'].map(h=>(
                        <th key={h} rowSpan={2} style={{padding:'8px 8px',textAlign:'center',fontSize:'0.7rem',fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',borderBottom:'2px solid var(--border)',borderLeft:'2px solid var(--border)',minWidth:h==='Status'?75:45,background:'var(--bg-elevated)'}}>
                          {h}
                        </th>
                      ))}
                    </tr>
                    {/* Row 2: day of week */}
                    <tr style={{background:'var(--bg-elevated)'}}>
                      {dates.map(d=>{
                        const day=['Su','Mo','Tu','We','Th','Fr','Sa'][new Date(d).getDay()]
                        return(
                          <th key={d} style={{padding:'2px 4px',textAlign:'center',fontSize:'0.6rem',color:'var(--text-muted)',borderBottom:'2px solid var(--border)',borderRight:'1px solid var(--border-light)',background:'var(--bg-elevated)',fontWeight:500}}>
                            {day}
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student,idx)=>{
                      const{present,absent,pct,eligible}=calcStats(student.enrollmentNumber)
                      return(
                        <tr key={student.enrollmentNumber} style={{borderBottom:'1px solid var(--border)',background:idx%2===0?'var(--bg-surface)':'var(--bg-elevated)'}}>
                          <td style={{padding:'8px 12px',position:'sticky',left:0,background:idx%2===0?'var(--bg-surface)':'var(--bg-elevated)',zIndex:1,borderRight:'1px solid var(--border)'}}>
                            <span style={{color:'var(--text-muted)',fontSize:'0.7rem',marginRight:6}}>{idx+1}.</span>
                            <span style={{fontFamily:'var(--font-display)',fontWeight:700,fontSize:'0.78rem',color:'var(--accent)'}}>{student.enrollmentNumber}</span>
                            <div style={{fontSize:'0.73rem',color:'var(--text-secondary)',marginTop:1}}>{student.name}</div>
                          </td>
                          {dates.map(d=>{
                            const st=attendance?.[student.enrollmentNumber]?.[d]||'A'
                            return(
                              <td key={d} style={{textAlign:'center',padding:'6px 2px',borderRight:'1px solid var(--border-light)'}}>
                                <span style={{fontSize:'0.78rem',fontWeight:700,fontFamily:'var(--font-display)',color:STATUS_COLORS[st]}}>{st}</span>
                              </td>
                            )
                          })}
                          <td style={{textAlign:'center',padding:'6px 8px',borderLeft:'2px solid var(--border)',fontFamily:'var(--font-display)',fontWeight:700,color:'var(--green)',fontSize:'0.82rem'}}>{present}</td>
                          <td style={{textAlign:'center',padding:'6px 8px',fontFamily:'var(--font-display)',fontWeight:700,color:'var(--red)',fontSize:'0.82rem'}}>{absent}</td>
                          <td style={{textAlign:'center',padding:'6px 8px',fontFamily:'var(--font-display)',fontWeight:800,fontSize:'0.82rem',color:eligible?'var(--green)':pct>=criteria.minPercentage-10?'var(--amber)':'var(--red)'}}>{pct}%</td>
                          <td style={{textAlign:'center',padding:'6px 8px'}}>
                            <span style={{padding:'2px 8px',borderRadius:99,fontSize:'0.68rem',fontWeight:800,fontFamily:'var(--font-display)',background:eligible?'var(--green-dim)':'var(--red-dim)',color:eligible?'var(--green)':'var(--red)'}}>
                              {eligible?'✓ OK':'✗ SHORT'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  {/* Footer totals */}
                  <tfoot>
                    <tr style={{background:'var(--bg-elevated)',borderTop:'2px solid var(--border)'}}>
                      <td style={{padding:'8px 12px',fontFamily:'var(--font-display)',fontWeight:700,fontSize:'0.78rem',position:'sticky',left:0,background:'var(--bg-elevated)',borderRight:'1px solid var(--border)'}}>Total Present</td>
                      {dates.map(d=>{
                        const count=students.filter(s=>(attendance?.[s.enrollmentNumber]?.[d]||'A')==='P').length
                        return <td key={d} style={{textAlign:'center',padding:'6px 2px',fontSize:'0.75rem',fontWeight:700,color:'var(--green)',borderRight:'1px solid var(--border-light)'}}>{count}</td>
                      })}
                      <td colSpan={4} style={{borderLeft:'2px solid var(--border)'}}/>
                    </tr>
                    <tr style={{background:'var(--bg-elevated)'}}>
                      <td style={{padding:'8px 12px',fontFamily:'var(--font-display)',fontWeight:700,fontSize:'0.78rem',position:'sticky',left:0,background:'var(--bg-elevated)',borderRight:'1px solid var(--border)'}}>Total Absent</td>
                      {dates.map(d=>{
                        const count=students.filter(s=>(attendance?.[s.enrollmentNumber]?.[d]||'A')==='A').length
                        return <td key={d} style={{textAlign:'center',padding:'6px 2px',fontSize:'0.75rem',fontWeight:700,color:'var(--red)',borderRight:'1px solid var(--border-light)'}}>{count}</td>
                      })}
                      <td colSpan={4} style={{borderLeft:'2px solid var(--border)'}}/>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── ELIGIBILITY SUMMARY TAB ── */}
      {activeTab==='eligibility'&&(()=>{
        const statsAll=students.map(s=>({...calcStats(s.enrollmentNumber),student:s}))
        const eligCount=statsAll.filter(x=>x.eligible).length
        const avgPct=statsAll.length?Math.round(statsAll.reduce((a,x)=>a+x.pct,0)/statsAll.length):0
        return(
          <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:20,alignItems:'start'}}>
            <div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:16}}>
                {[
                  {label:'Working Days',value:workingDays,color:'var(--accent)'},
                  {label:'Total Students',value:students.length,color:'var(--blue)'},
                  {label:`Eligible (≥${criteria.minPercentage}%)`,value:eligCount,color:'var(--green)'},
                  {label:'Not Eligible',value:students.length-eligCount,color:'var(--red)'},
                  {label:'Avg Attendance',value:`${avgPct}%`,color:'var(--amber)'},
                ].map(item=>(
                  <div key={item.label} className="card" style={{padding:'16px 12px',textAlign:'center',borderTop:`3px solid ${item.color}`}}>
                    <div style={{fontFamily:'var(--font-display)',fontWeight:800,fontSize:'1.6rem',color:item.color,lineHeight:1,marginBottom:6}}>{item.value}</div>
                    <div style={{fontSize:'0.65rem',color:'var(--text-muted)',fontFamily:'var(--font-display)',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em'}}>{item.label}</div>
                  </div>
                ))}
              </div>
              <div className="card" style={{padding:0}}>
                <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <span style={{fontSize:'0.875rem',fontFamily:'var(--font-display)',fontWeight:700}}>Student Eligibility</span>
                  <span style={{fontSize:'0.72rem',color:'var(--text-muted)'}}>Threshold: <strong style={{color:'var(--accent)'}}>{criteria.minPercentage}%</strong></span>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th><th>Enrollment / Name</th>
                        {dates.map(d=><th key={d} style={{textAlign:'center',minWidth:42}}>{fmtDate(d)}</th>)}
                        <th style={{textAlign:'center'}}>P</th><th style={{textAlign:'center'}}>A</th>
                        <th style={{textAlign:'center'}}>W.Days</th><th style={{textAlign:'center'}}>%</th>
                        <th style={{textAlign:'center'}}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statsAll.map(({student,present,absent,wDays,pct,eligible},i)=>(
                        <tr key={student.enrollmentNumber}>
                          <td style={{color:'var(--text-muted)',fontWeight:600}}>{i+1}</td>
                          <td>
                            <div style={{color:'var(--accent)',fontFamily:'var(--font-display)',fontWeight:700,fontSize:'0.8rem'}}>{student.enrollmentNumber}</div>
                            <div style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>{student.name}</div>
                          </td>
                          {dates.map(d=>{
                            const status=attendance?.[student.enrollmentNumber]?.[d]||'A'
                            return <td key={d} style={{textAlign:'center',fontFamily:'var(--font-display)',fontWeight:700,fontSize:'0.8rem',color:STATUS_COLORS[status]||'var(--text-muted)'}}>{status}</td>
                          })}
                          <td style={{textAlign:'center',color:'var(--green)',fontFamily:'var(--font-display)',fontWeight:700}}>{present}</td>
                          <td style={{textAlign:'center',color:'var(--red)',fontFamily:'var(--font-display)',fontWeight:700}}>{absent}</td>
                          <td style={{textAlign:'center',color:'var(--text-muted)'}}>{wDays}</td>
                          <td style={{textAlign:'center',fontFamily:'var(--font-display)',fontWeight:800,color:eligible?'var(--green)':'var(--red)'}}>{pct}%</td>
                          <td style={{textAlign:'center'}}>
                            {eligible
                              ?<span className="badge badge-green" style={{display:'inline-flex',alignItems:'center',gap:4}}><CheckCircle size={10}/> Eligible</span>
                              :<span className="badge badge-red" style={{display:'inline-flex',alignItems:'center',gap:4}}><XCircle size={10}/> Short</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <EligibilityCriteriaPanel subjectCode={profile?.subjectCode} criteria={criteria} onChange={setCriteria} onSave={saveCriteria} saving={savingCriteria}/>
          </div>
        )
      })()}
    </div>
  )
}