import React, { useEffect, useState } from 'react'
import { API } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { Search, Plus, Trash2, X, ChevronLeft, ChevronRight, Upload, Users, AlertTriangle } from 'lucide-react'

const statusOpts = [
  { value:'', label:'All Status' },
  { value:'not_started', label:'Not Started' },
  { value:'in_process',  label:'In Process'  },
  { value:'placed',      label:'Placed'      },
  { value:'opted_out',   label:'Opted Out'   },
  { value:'higher_studies', label:'Higher Studies' },
]
const statusBadge = { placed:'badge-green', in_process:'badge-amber', not_started:'badge-muted', opted_out:'badge-red', higher_studies:'badge-blue' }
const emptyForm = { enrollmentNumber:'', name:'', email:'', phone:'', division:'A', batch:'2025-2029', semester:1, year:1, cgpa:'', technicalSkills:'', programmingLanguages:'', placementStatus:'not_started' }

// ── CSV template download ──
const downloadTemplate = () => {
  const csv = 'enrollmentNumber,name,email,phone,division,batch,semester,year,cgpa\nIT25001,Student Name,student@email.com,9876543210,A,2025-2029,1,1,0'
  const blob = new Blob([csv], { type:'text/csv' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
  a.download = 'batch_upload_template.csv'; a.click()
}

export default function ManageStudents() {
  const [students,    setStudents]   = useState([])
  const [total,       setTotal]      = useState(0)
  const [page,        setPage]       = useState(1)
  const [loading,     setLoading]    = useState(false)
  const [search,      setSearch]     = useState('')
  const [status,      setStatus]     = useState('')
  const [cgpaMin,     setCgpaMin]    = useState('')
  const [batchFilter, setBatchFilter]= useState('')
  const [batches,     setBatches]    = useState([])
  const [showModal,   setShowModal]  = useState(false)
  const [showBatch,   setShowBatch]  = useState(false)
  const [showDelete,  setShowDelete] = useState(false)
  const [form,        setForm]       = useState(emptyForm)
  const [saving,      setSaving]     = useState(false)
  const [csvFile,     setCsvFile]    = useState(null)
  const [csvPreview,  setCsvPreview] = useState([])
  const [uploading,   setUploading]  = useState(false)
  const [deleteBatch, setDeleteBatch]= useState('')
  const limit = 15

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit })
      if (search)      params.set('search', search)
      if (status)      params.set('status', status)
      if (cgpaMin)     params.set('cgpa', cgpaMin)
      if (batchFilter) params.set('batch', batchFilter)
      const { data } = await API.get(`/students?${params}`)
      setStudents(data.data)
      setTotal(data.total)
    } catch { toast.error('Failed to load students') }
    finally { setLoading(false) }
  }

  const fetchBatches = async () => {
    try {
      const { data } = await API.get('/students/batches')
      setBatches(data.data || [])
    } catch {
      // fallback: extract from students
    }
  }

  useEffect(() => { fetchStudents(); fetchBatches() }, [page, status, batchFilter])

  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchStudents() }

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const payload = {
        ...form,
        cgpa: parseFloat(form.cgpa) || 0,
        semester: parseInt(form.semester) || 1,
        year: parseInt(form.year) || 1,
        technicalSkills: form.technicalSkills.split(',').map(s=>s.trim()).filter(Boolean),
        programmingLanguages: form.programmingLanguages.split(',').map(s=>s.trim()).filter(Boolean),
      }
      await API.post('/students', payload)
      toast.success('Student created!')
      setShowModal(false); setForm(emptyForm); fetchStudents(); fetchBatches()
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async (enroll) => {
    if (!confirm(`Deactivate student ${enroll}?`)) return
    try { await API.delete(`/students/${enroll}`); toast.success('Deactivated'); fetchStudents() }
    catch { toast.error('Failed') }
  }

  // ── CSV parse ──
  const handleCsvChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setCsvFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const lines = ev.target.result.split('\n').filter(Boolean)
      const headers = lines[0].split(',').map(h=>h.trim())
      const rows = lines.slice(1,6).map(line => {
        const vals = line.split(',').map(v=>v.trim())
        const obj = {}
        headers.forEach((h,i) => { obj[h] = vals[i]||'' })
        return obj
      })
      setCsvPreview(rows)
    }
    reader.readAsText(file)
  }

  // ── Bulk upload CSV ──
  const handleBatchUpload = async () => {
    if (!csvFile) return toast.error('Select a CSV file')
    setUploading(true)
    try {
      const text = await csvFile.text()
      const lines = text.split('\n').filter(Boolean)
      const headers = lines[0].split(',').map(h=>h.trim())
      const students = lines.slice(1).map(line => {
        const vals = line.split(',').map(v=>v.trim())
        const obj = {}
        headers.forEach((h,i) => { obj[h] = vals[i]||'' })
        return {
          enrollmentNumber: obj.enrollmentNumber,
          name:             obj.name,
          email:            obj.email,
          phone:            obj.phone||'',
          division:         obj.division||'A',
          batch:            obj.batch||emptyForm.batch,
          semester:         parseInt(obj.semester)||1,
          year:             parseInt(obj.year)||1,
          cgpa:             parseFloat(obj.cgpa)||0,
          placementStatus:  'not_started',
          branch:           'Information Technology',
        }
      }).filter(s => s.enrollmentNumber && s.name)

      if (!students.length) return toast.error('No valid rows found')

      // Create students one by one (or use bulk endpoint if available)
      let success=0, failed=0
      for (const s of students) {
        try { await API.post('/students', s); success++ }
        catch { failed++ }
      }
      toast.success(`Uploaded: ${success} students${failed>0?`, ${failed} failed`:''}`)
      setShowBatch(false); setCsvFile(null); setCsvPreview([])
      fetchStudents(); fetchBatches()
    } catch (err) { toast.error('Upload failed') }
    finally { setUploading(false) }
  }

  // ── Delete entire batch ──
  const handleDeleteBatch = async () => {
    if (!deleteBatch) return toast.error('Select a batch')
    if (!confirm(`Delete ALL students from batch ${deleteBatch}? This cannot be undone.`)) return
    try {
      await API.delete(`/students/batch/${deleteBatch}`)
      toast.success(`Batch ${deleteBatch} deleted`)
      setShowDelete(false); setDeleteBatch('')
      fetchStudents(); fetchBatches()
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed') }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24}}>
        <div>
          <h1 style={{fontSize:'1.5rem',fontWeight:800,letterSpacing:'-0.03em'}}>Manage Students</h1>
          <p style={{color:'var(--text-muted)',fontSize:'0.875rem',marginTop:4}}>{total} total students</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-ghost" onClick={()=>setShowDelete(true)} style={{color:'var(--red)',borderColor:'var(--red-dim)'}}>
            <Trash2 size={14}/> Delete Batch
          </button>
          <button className="btn btn-ghost" onClick={()=>setShowBatch(true)}>
            <Upload size={14}/> Upload Batch
          </button>
          <button className="btn btn-primary" onClick={()=>setShowModal(true)}>
            <Plus size={15}/> Add Student
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{marginBottom:20,padding:'16px 20px'}}>
        <form onSubmit={handleSearch} style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end'}}>
          <div className="form-group" style={{flex:2,minWidth:200}}>
            <label className="form-label">Search</label>
            <div style={{position:'relative'}}>
              <Search size={14} style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)'}}/>
              <input className="form-input" placeholder="Name or Enrollment No." value={search} onChange={e=>setSearch(e.target.value)} style={{paddingLeft:32}}/>
            </div>
          </div>
          <div className="form-group" style={{minWidth:140}}>
            <label className="form-label">Batch</label>
            <select className="form-input" value={batchFilter} onChange={e=>{setBatchFilter(e.target.value);setPage(1)}}>
              <option value="">All Batches</option>
              {batches.map(b=><option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="form-group" style={{minWidth:140}}>
            <label className="form-label">Status</label>
            <select className="form-input" value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}}>
              {statusOpts.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="form-group" style={{minWidth:110}}>
            <label className="form-label">Min CGPA</label>
            <input type="number" className="form-input" placeholder="e.g. 7.0" value={cgpaMin} onChange={e=>setCgpaMin(e.target.value)} min="0" max="10" step="0.1"/>
          </div>
          <button type="submit" className="btn btn-primary"><Search size={14}/> Search</button>
        </form>
      </div>

      {/* Table */}
      <div className="card" style={{padding:0}}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Enrollment</th><th>Name</th><th>Batch</th><th>CGPA</th><th>Div</th><th>Status</th><th>Score</th><th>Action</th></tr>
            </thead>
            <tbody>
              {loading?(
                <tr><td colSpan={8} style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10}}><div className="spinner"/> Loading…</div>
                </td></tr>
              ):students.length===0?(
                <tr><td colSpan={8} style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>No students found</td></tr>
              ):students.map(s=>(
                <tr key={s._id}>
                  <td style={{color:'var(--accent)',fontFamily:'var(--font-display)',fontWeight:700,fontSize:'0.8rem'}}>{s.enrollmentNumber}</td>
                  <td style={{fontWeight:500}}>{s.name}</td>
                  <td style={{fontSize:'0.78rem',color:'var(--text-muted)'}}>{s.batch||'—'}</td>
                  <td style={{fontFamily:'var(--font-display)',fontWeight:700}}>{s.cgpa?.toFixed(1)}</td>
                  <td>{s.division}</td>
                  <td><span className={`badge ${statusBadge[s.placementStatus]||'badge-muted'}`}>{s.placementStatus?.replace(/_/g,' ')}</span></td>
                  <td><span className={s.placementReadinessScore>=70?'score-high':s.placementReadinessScore>=40?'score-medium':'score-low'} style={{fontFamily:'var(--font-display)',fontWeight:700}}>{s.placementReadinessScore||0}</span></td>
                  <td><button onClick={()=>handleDelete(s.enrollmentNumber)} className="btn btn-danger" style={{padding:'5px 10px',fontSize:'0.75rem'}}><Trash2 size={12}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages>1&&(
          <div style={{padding:'16px 20px',borderTop:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>Page {page} of {totalPages} — {total} students</span>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-ghost" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{padding:'6px 12px'}}><ChevronLeft size={14}/></button>
              <button className="btn btn-ghost" onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} style={{padding:'6px 12px'}}><ChevronRight size={14}/></button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add Student Modal ── */}
      {showModal&&(
        <div style={{position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div className="card" style={{width:'100%',maxWidth:560,maxHeight:'90vh',overflow:'auto'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24}}>
              <h3 style={{fontFamily:'var(--font-display)',fontWeight:800}}>Add New Student</h3>
              <button onClick={()=>setShowModal(false)} style={{color:'var(--text-muted)',cursor:'pointer',background:'none',border:'none'}}><X size={18}/></button>
            </div>
            <form onSubmit={handleCreate} style={{display:'flex',flexDirection:'column',gap:14}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div className="form-group"><label className="form-label">Enrollment No. *</label><input required className="form-input" placeholder="e.g. IT25001" value={form.enrollmentNumber} onChange={e=>setForm({...form,enrollmentNumber:e.target.value})}/></div>
                <div className="form-group"><label className="form-label">Full Name *</label><input required className="form-input" placeholder="Student Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
                <div className="form-group"><label className="form-label">Email *</label><input required type="email" className="form-input" placeholder="student@email.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div>
                <div className="form-group"><label className="form-label">Phone</label><input className="form-input" placeholder="10-digit" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div>
                <div className="form-group"><label className="form-label">Batch *</label><input required className="form-input" placeholder="2025-2029" value={form.batch} onChange={e=>setForm({...form,batch:e.target.value})}/></div>
                <div className="form-group"><label className="form-label">Division</label><select className="form-input" value={form.division} onChange={e=>setForm({...form,division:e.target.value})}>{['A','B','C','D'].map(d=><option key={d}>{d}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Semester</label><select className="form-input" value={form.semester} onChange={e=>setForm({...form,semester:e.target.value})}>{[1,2,3,4,5,6,7,8].map(n=><option key={n} value={n}>Sem {n}</option>)}</select></div>
                <div className="form-group"><label className="form-label">CGPA</label><input type="number" step="0.01" min="0" max="10" className="form-input" placeholder="e.g. 0.00" value={form.cgpa} onChange={e=>setForm({...form,cgpa:e.target.value})}/></div>
              </div>
              <div className="form-group"><label className="form-label">Technical Skills (comma separated)</label><input className="form-input" placeholder="React, Node.js" value={form.technicalSkills} onChange={e=>setForm({...form,technicalSkills:e.target.value})}/></div>
              <div style={{display:'flex',gap:10,marginTop:8}}>
                <button type="button" className="btn btn-ghost" onClick={()=>setShowModal(false)} style={{flex:1,justifyContent:'center'}}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{flex:1,justifyContent:'center'}}>
                  {saving?<><div className="spinner" style={{width:14,height:14}}/> Saving…</>:'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Upload Batch Modal ── */}
      {showBatch&&(
        <div style={{position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div className="card" style={{width:'100%',maxWidth:600,maxHeight:'90vh',overflow:'auto'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <Users size={18} color="var(--accent)"/>
                <h3 style={{fontFamily:'var(--font-display)',fontWeight:800}}>Upload New Batch</h3>
              </div>
              <button onClick={()=>{setShowBatch(false);setCsvFile(null);setCsvPreview([])}} style={{color:'var(--text-muted)',cursor:'pointer',background:'none',border:'none'}}><X size={18}/></button>
            </div>

            <div style={{padding:'12px 14px',background:'var(--bg-elevated)',borderRadius:8,border:'1px solid var(--border)',marginBottom:16,fontSize:'0.8rem',color:'var(--text-muted)'}}>
              <strong style={{color:'var(--text-primary)'}}>CSV Format:</strong> enrollmentNumber, name, email, phone, division, batch, semester, year, cgpa
              <button onClick={downloadTemplate} style={{marginLeft:12,color:'var(--accent)',background:'none',border:'none',cursor:'pointer',fontSize:'0.78rem',fontWeight:600}}>
                ⬇ Download Template
              </button>
            </div>

            <div className="form-group" style={{marginBottom:16}}>
              <label className="form-label">Select CSV File</label>
              <input type="file" accept=".csv" className="form-input" onChange={handleCsvChange} style={{padding:'8px'}}/>
            </div>

            {csvPreview.length>0&&(
              <div style={{marginBottom:16}}>
                <div style={{fontSize:'0.72rem',color:'var(--text-muted)',fontWeight:700,textTransform:'uppercase',marginBottom:8}}>Preview (first 5 rows)</div>
                <div style={{overflowX:'auto',border:'1px solid var(--border)',borderRadius:8}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.75rem'}}>
                    <thead>
                      <tr style={{background:'var(--bg-elevated)'}}>
                        {Object.keys(csvPreview[0]).map(h=><th key={h} style={{padding:'6px 10px',textAlign:'left',borderBottom:'1px solid var(--border)',color:'var(--text-muted)',fontWeight:600}}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.map((row,i)=>(
                        <tr key={i} style={{borderBottom:'1px solid var(--border)'}}>
                          {Object.values(row).map((v,j)=><td key={j} style={{padding:'6px 10px',color:'var(--text-primary)'}}>{v}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={{display:'flex',gap:10}}>
              <button className="btn btn-ghost" onClick={()=>{setShowBatch(false);setCsvFile(null);setCsvPreview([])}} style={{flex:1,justifyContent:'center'}}>Cancel</button>
              <button className="btn btn-primary" onClick={handleBatchUpload} disabled={uploading||!csvFile} style={{flex:1,justifyContent:'center'}}>
                {uploading?<><div className="spinner" style={{width:14,height:14}}/> Uploading…</>:<><Upload size={14}/> Upload Batch</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Batch Modal ── */}
      {showDelete&&(
        <div style={{position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div className="card" style={{width:'100%',maxWidth:420}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
              <AlertTriangle size={20} color="var(--red)"/>
              <h3 style={{fontFamily:'var(--font-display)',fontWeight:800,color:'var(--red)'}}>Delete Batch</h3>
            </div>
            <p style={{fontSize:'0.85rem',color:'var(--text-muted)',marginBottom:16}}>
              This will permanently delete all students of the selected batch including their attendance, projects, and profile data.
            </p>
            <div className="form-group" style={{marginBottom:20}}>
              <label className="form-label">Select Batch to Delete</label>
              <select className="form-input" value={deleteBatch} onChange={e=>setDeleteBatch(e.target.value)}>
                <option value="">— Select Batch —</option>
                {batches.map(b=><option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div style={{display:'flex',gap:10}}>
              <button className="btn btn-ghost" onClick={()=>{setShowDelete(false);setDeleteBatch('')}} style={{flex:1,justifyContent:'center'}}>Cancel</button>
              <button onClick={handleDeleteBatch} disabled={!deleteBatch} style={{flex:1,padding:'10px',background:'var(--red)',color:'white',border:'none',borderRadius:'var(--radius)',cursor:'pointer',fontWeight:600,fontSize:'0.875rem',display:'flex',alignItems:'center',justifyContent:'center',gap:6,opacity:!deleteBatch?0.5:1}}>
                <Trash2 size={14}/> Delete Batch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}