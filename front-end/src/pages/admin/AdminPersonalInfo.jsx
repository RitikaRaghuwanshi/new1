import React, { useState } from 'react'
import { API } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import {
  Search, Download, User, Phone, MapPin, Users, BookOpen,
  Heart, Shield, AlertCircle, FileDown, RefreshCw
} from 'lucide-react'

const SECTION_COLORS = {
  basic:     'var(--accent)',
  contact:   'var(--blue)',
  parents:   'var(--purple)',
  address:   'var(--green)',
  academic:  'var(--amber)',
  emergency: 'var(--red)',
}

function Row({ label, value }) {
  if (!value && value !== false) return null
  const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value
  return (
    <div style={{
      display:'flex', gap:16, padding:'10px 0',
      borderBottom:'1px solid var(--border)',
      alignItems:'flex-start',
    }}>
      <div style={{
        width:200, flexShrink:0,
        fontSize:'0.75rem', fontFamily:'var(--font-display)', fontWeight:700,
        color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em',
        paddingTop:2,
      }}>
        {label}
      </div>
      <div style={{ flex:1, fontSize:'0.875rem', color:'var(--text-primary)', fontWeight:500 }}>
        {display || <span style={{ color:'var(--text-muted)', fontStyle:'italic' }}>Not provided</span>}
      </div>
    </div>
  )
}

function Section({ title, icon: Icon, color, children }) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{
        display:'flex', alignItems:'center', gap:10,
        marginBottom:12, paddingBottom:10,
        borderBottom:`2px solid ${color}30`,
      }}>
        <div style={{
          width:32, height:32, borderRadius:8,
          background:`${color}15`, border:`1px solid ${color}25`,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <Icon size={15} color={color} />
        </div>
        <span style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'0.9rem', color }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

function AddressDisplay({ addr, label }) {
  if (!addr) return null
  const parts = [addr.line1, addr.line2, addr.city, addr.state, addr.pincode, addr.country].filter(Boolean)
  if (!parts.length) return <Row label={label} value={null} />
  return <Row label={label} value={parts.join(', ')} />
}

// Build printable HTML and trigger download as HTML file (no PDF lib needed)
function downloadAsHTML(data) {
  const fmt = (v) => v || '<span style="color:#94a3b8;font-style:italic">Not provided</span>'
  const row = (label, val) => {
    if (!val && val !== false && val !== 0) return ''
    const display = typeof val === 'boolean' ? (val ? 'Yes' : 'No') : val
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:12px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;white-space:nowrap;width:200px">${label}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#1e293b">${fmt(display)}</td>
    </tr>`
  }
  const addrStr = (a) => a ? [a.line1,a.line2,a.city,a.state,a.pincode,a.country].filter(Boolean).join(', ') : null

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Personal Info - ${data.enrollmentNumber}</title>
  <style>
    body{font-family:'Segoe UI',sans-serif;margin:0;padding:32px;color:#1e293b;background:#fff}
    .header{background:linear-gradient(135deg,#7c3aed,#9d5cf5);color:#fff;padding:24px 28px;border-radius:12px;margin-bottom:24px}
    .header h1{margin:0 0 4px;font-size:22px}
    .header p{margin:0;opacity:0.8;font-size:13px}
    .section{margin-bottom:20px}
    .section-title{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#7c3aed;border-bottom:2px solid #ede9ff;padding-bottom:8px;margin-bottom:2px}
    table{width:100%;border-collapse:collapse}
    .footer{margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8}
    @media print{body{padding:0}button{display:none}}
  </style>
</head>
<body>
  <div class="header">
    <h1>${data.fullName || data.studentName || 'Student'}</h1>
    <p>Enrollment: ${data.enrollmentNumber} &nbsp;|&nbsp; Branch: ${data.branch || 'IT'} &nbsp;|&nbsp; Batch: ${data.batch || ''} &nbsp;|&nbsp; Div: ${data.division || ''} &nbsp;|&nbsp; Sem: ${data.semester || ''}</p>
  </div>

  <div class="section">
    <div class="section-title">Basic Information</div>
    <table>
      ${row('Full Name', data.fullName)}
      ${row('Date of Birth', data.dateOfBirth)}
      ${row('Gender', data.gender)}
      ${row('Blood Group', data.bloodGroup)}
      ${row('Category', data.category)}
      ${row('Religion', data.religion)}
      ${row('Nationality', data.nationality)}
      ${row('Aadhar Number', data.aadharNumber)}
    </table>
  </div>

  <div class="section">
    <div class="section-title">Contact Details</div>
    <table>
      ${row('Personal Email', data.personalEmail)}
      ${row('Mobile Number', data.mobileNumber)}
      ${row('Alternate Mobile', data.alternateMobile)}
    </table>
  </div>

  <div class="section">
    <div class="section-title">Parents / Guardian</div>
    <table>
      ${row("Father's Name", data.fatherName)}
      ${row("Father's Occupation", data.fatherOccupation)}
      ${row("Father's Mobile", data.fatherMobile)}
      ${row("Mother's Name", data.motherName)}
      ${row("Mother's Occupation", data.motherOccupation)}
      ${row("Mother's Mobile", data.motherMobile)}
      ${row('Annual Family Income', data.annualFamilyIncome)}
      ${row('Guardian Name', data.guardianName)}
      ${row('Guardian Relation', data.guardianRelation)}
      ${row('Guardian Mobile', data.guardianMobile)}
    </table>
  </div>

  <div class="section">
    <div class="section-title">Address Details</div>
    <table>
      ${row('Permanent Address', addrStr(data.permanentAddress))}
      ${row('Temporary Address', data.sameAsPermanent ? 'Same as permanent' : addrStr(data.temporaryAddress))}
    </table>
  </div>

  <div class="section">
    <div class="section-title">Academic / Hostel</div>
    <table>
      ${row('CGPA', data.cgpa)}
      ${row('Placement Status', data.placementStatus)}
      ${row('Admission Year', data.admissionYear)}
      ${row('Roll Number', data.rollNumber)}
      ${row('Hostel Resident', data.hostelResident)}
      ${row('Hostel Block', data.hostelBlock)}
      ${row('Bus Route', data.busRoute)}
    </table>
  </div>

  <div class="section">
    <div class="section-title">Emergency Contact</div>
    <table>
      ${row('Name', data.emergencyContactName)}
      ${row('Phone', data.emergencyContactPhone)}
      ${row('Relation', data.emergencyContactRelation)}
    </table>
  </div>

  <div class="footer">
    Generated by AcadPlace &nbsp;|&nbsp; ${new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })} &nbsp;|&nbsp; IT Department &nbsp;|&nbsp; CONFIDENTIAL
  </div>
  <script>window.onload=()=>window.print()</script>
</body>
</html>`

  const blob = new Blob([html], { type:'text/html' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${data.enrollmentNumber}_personal_info.html`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminPersonalInfo() {
  const [search,      setSearch]      = useState('')
  const [info,        setInfo]        = useState(null)
  const [student,     setStudent]     = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [notFound,    setNotFound]    = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!search.trim()) return
    setLoading(true)
    setInfo(null)
    setStudent(null)
    setNotFound(false)

    try {
      const [infoRes, studentRes] = await Promise.all([
        API.get(`/personal-info/${search.trim().toUpperCase()}`),
        API.get(`/students/${search.trim().toUpperCase()}`),
      ])
      setInfo(infoRes.data.data)
      setStudent(studentRes.data.data)
    } catch (err) {
      if (err?.response?.status === 404) setNotFound(true)
      else toast.error('Failed to fetch personal info')
    } finally { setLoading(false) }
  }

  const handleDownload = async () => {
    if (!info) return
    setDownloading(true)
    try {
      const merged = {
        ...info,
        studentName:     student?.name,
        branch:          student?.branch,
        division:        student?.division,
        batch:           student?.batch,
        semester:        student?.semester,
        cgpa:            student?.cgpa,
        placementStatus: student?.placementStatus,
      }
      downloadAsHTML(merged)
      toast.success('Download started — print to PDF from browser')
    } catch { toast.error('Download failed') }
    finally { setDownloading(false) }
  }

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:'1.5rem', fontWeight:800, letterSpacing:'-0.03em' }}>Student Personal Info</h1>
          <p style={{ color:'var(--text-muted)', fontSize:'0.875rem', marginTop:4 }}>
            View confidential student records by enrollment number
          </p>
        </div>
        <div style={{
          display:'flex', alignItems:'center', gap:6,
          padding:'6px 14px', borderRadius:99,
          background:'var(--accent-glow)', border:'1px solid rgba(124,58,237,0.2)',
        }}>
          <Shield size={12} color="var(--accent)" />
          <span style={{ fontSize:'0.72rem', color:'var(--accent)', fontWeight:700 }}>Admin Only</span>
        </div>
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom:24, padding:'20px 24px' }}>
        <form onSubmit={handleSearch} style={{ display:'flex', gap:12 }}>
          <div style={{ flex:1, position:'relative' }}>
            <Search size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
            <input
              className="form-input"
              style={{ paddingLeft:38, width:'100%' }}
              placeholder="Enter Enrollment Number (e.g. 0101IT221040)"
              value={search}
              onChange={e => setSearch(e.target.value.toUpperCase())}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <><div className="spinner" style={{ width:14, height:14 }} /> Searching…</> : <><Search size={14} /> Search</>}
          </button>
        </form>
      </div>

      {/* Not found */}
      {notFound && (
        <div className="card" style={{ textAlign:'center', padding:48 }}>
          <AlertCircle size={36} style={{ color:'var(--text-muted)', margin:'0 auto 12px' }} />
          <div style={{ fontWeight:700, marginBottom:4 }}>Student not found</div>
          <p style={{ color:'var(--text-muted)', fontSize:'0.875rem' }}>
            No student found with enrollment <strong>{search}</strong>. Check the enrollment number and try again.
          </p>
        </div>
      )}

      {/* Info card */}
      {info && student && (
        <div>
          {/* Student header banner */}
          <div style={{
            background:'linear-gradient(135deg,var(--accent),var(--accent-mid))',
            borderRadius:16, padding:'20px 24px', marginBottom:20,
            display:'flex', alignItems:'center', justifyContent:'space-between',
            boxShadow:'0 8px 24px rgba(124,58,237,0.2)',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <div style={{
                width:52, height:52, borderRadius:14,
                background:'rgba(255,255,255,0.2)', border:'2px solid rgba(255,255,255,0.4)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:20, fontWeight:900, color:'#fff', fontFamily:'var(--font-display)',
              }}>
                {student.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ color:'#fff' }}>
                <div style={{ fontSize:18, fontWeight:800, fontFamily:'var(--font-display)' }}>{student.name}</div>
                <div style={{ fontSize:12, opacity:0.8, marginTop:4 }}>
                  {student.enrollmentNumber} &nbsp;·&nbsp; {student.branch} &nbsp;·&nbsp; Div {student.division} &nbsp;·&nbsp; Sem {student.semester} &nbsp;·&nbsp; CGPA {student.cgpa}
                </div>
              </div>
            </div>
            <button
              className="btn"
              onClick={handleDownload}
              disabled={downloading}
              style={{
                background:'rgba(255,255,255,0.2)', color:'#fff',
                border:'1px solid rgba(255,255,255,0.35)',
                backdropFilter:'blur(4px)',
              }}
            >
              {downloading
                ? <><RefreshCw size={14} style={{ animation:'spin 0.6s linear infinite' }} /> Preparing…</>
                : <><FileDown size={14} /> Download / Print</>}
            </button>
          </div>

          <div className="card">
            {/* BASIC */}
            <Section title="Basic Information" icon={User} color={SECTION_COLORS.basic}>
              <Row label="Full Name"    value={info.fullName} />
              <Row label="Date of Birth" value={info.dateOfBirth} />
              <Row label="Gender"       value={info.gender} />
              <Row label="Blood Group"  value={info.bloodGroup} />
              <Row label="Category"     value={info.category} />
              <Row label="Religion"     value={info.religion} />
              <Row label="Nationality"  value={info.nationality} />
              <Row label="Aadhar No."   value={info.aadharNumber ? `XXXX-XXXX-${info.aadharNumber.slice(-4)}` : null} />
            </Section>

            {/* CONTACT */}
            <Section title="Contact Details" icon={Phone} color={SECTION_COLORS.contact}>
              <Row label="Personal Email"   value={info.personalEmail} />
              <Row label="Mobile Number"    value={info.mobileNumber} />
              <Row label="Alternate Mobile" value={info.alternateMobile} />
            </Section>

            {/* PARENTS */}
            <Section title="Parents / Guardian" icon={Users} color={SECTION_COLORS.parents}>
              <Row label="Father's Name"       value={info.fatherName} />
              <Row label="Father's Occupation" value={info.fatherOccupation} />
              <Row label="Father's Mobile"     value={info.fatherMobile} />
              <Row label="Mother's Name"       value={info.motherName} />
              <Row label="Mother's Occupation" value={info.motherOccupation} />
              <Row label="Mother's Mobile"     value={info.motherMobile} />
              <Row label="Family Income"       value={info.annualFamilyIncome} />
              <Row label="Guardian Name"       value={info.guardianName} />
              <Row label="Guardian Relation"   value={info.guardianRelation} />
              <Row label="Guardian Mobile"     value={info.guardianMobile} />
            </Section>

            {/* ADDRESS */}
            <Section title="Address Details" icon={MapPin} color={SECTION_COLORS.address}>
              <AddressDisplay addr={info.permanentAddress} label="Permanent Address" />
              {info.sameAsPermanent
                ? <Row label="Temporary Address" value="Same as permanent address" />
                : <AddressDisplay addr={info.temporaryAddress} label="Temporary Address" />}
            </Section>

            {/* ACADEMIC */}
            <Section title="Academic / Hostel" icon={BookOpen} color={SECTION_COLORS.academic}>
              <Row label="CGPA"             value={student.cgpa} />
              <Row label="Placement Status" value={student.placementStatus?.replace(/_/g,' ')} />
              <Row label="Admission Year"   value={info.admissionYear} />
              <Row label="Roll Number"      value={info.rollNumber} />
              <Row label="Hostel Resident"  value={info.hostelResident} />
              <Row label="Hostel Block"     value={info.hostelBlock} />
              <Row label="Bus Route"        value={info.busRoute} />
            </Section>

            {/* EMERGENCY */}
            <Section title="Emergency Contact" icon={Heart} color={SECTION_COLORS.emergency}>
              <Row label="Contact Name"     value={info.emergencyContactName} />
              <Row label="Contact Phone"    value={info.emergencyContactPhone} />
              <Row label="Relation"         value={info.emergencyContactRelation} />
            </Section>

            {/* Meta */}
            <div style={{
              marginTop:8, padding:'12px 0', borderTop:'1px solid var(--border)',
              display:'flex', gap:24, fontSize:'0.72rem', color:'var(--text-muted)',
            }}>
              {info.lastUpdatedByStudent && (
                <span>Student last updated: <strong>{new Date(info.lastUpdatedByStudent).toLocaleDateString('en-IN',{ day:'numeric', month:'short', year:'numeric' })}</strong></span>
              )}
              {info.lastUpdatedByAdmin && (
                <span>Admin last updated: <strong>{new Date(info.lastUpdatedByAdmin).toLocaleDateString('en-IN',{ day:'numeric', month:'short', year:'numeric' })}</strong></span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!info && !notFound && !loading && (
        <div className="card" style={{ textAlign:'center', padding:64 }}>
          <div style={{
            width:64, height:64, borderRadius:18,
            background:'var(--accent-glow)', border:'1px solid rgba(124,58,237,0.15)',
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 16px',
          }}>
            <User size={28} color="var(--accent)" />
          </div>
          <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1.05rem', marginBottom:8 }}>
            Search for a Student
          </div>
          <p style={{ color:'var(--text-muted)', fontSize:'0.875rem', maxWidth:360, margin:'0 auto' }}>
            Enter a student's enrollment number above to view their confidential personal information.
          </p>
        </div>
      )}
    </div>
  )
}
