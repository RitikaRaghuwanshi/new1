import React from 'react'
import { useEffect, useState } from 'react'
import { useAuth, API } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import {
  Plus, X, Save, Code2, Briefcase, Award, FolderGit2,
  ChevronDown, ChevronUp, Trash2, Link, User, Home
} from 'lucide-react'

// ─── Tag Input ─────────────────────────────────────────────────────────────────
const TagInput = ({ label, values, onChange, placeholder }) => {
  const [input, setInput] = useState('')
  const add = () => {
    const v = input.trim()
    if (v && !values.includes(v)) onChange([...values, v])
    setInput('')
  }
  const remove = (i) => onChange(values.filter((_, idx) => idx !== i))
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="form-input" style={{ flex: 1 }}
          value={input} placeholder={placeholder}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
        />
        <button type="button" className="btn btn-ghost" style={{ padding: '8px 14px' }} onClick={add}>
          <Plus size={14} />
        </button>
      </div>
      {values.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {values.map((v, i) => (
            <span key={i} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 99,
              background: 'var(--bg-hover)', border: '1px solid var(--border-light)',
              fontSize: '0.78rem', color: 'var(--text-primary)'
            }}>
              {v}
              <button type="button" onClick={() => remove(i)}
                style={{ color: 'var(--text-muted)', cursor: 'pointer', lineHeight: 0, background: 'none', border: 'none' }}>
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Section Header ────────────────────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, title, color = 'var(--accent)', open, onToggle }) => (
  <button type="button" onClick={onToggle} style={{
    width: '100%', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', background: 'none',
    border: 'none', cursor: 'pointer', padding: '0 0 14px',
    borderBottom: '1px solid var(--border)', marginBottom: 20
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: `${color}18`, border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Icon size={15} color={color} strokeWidth={2} />
      </div>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem' }}>{title}</span>
    </div>
    {open ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
  </button>
)

// ─── Delete Button with confirm ────────────────────────────────────────────────
const DeleteButton = ({ onClick, label = 'Delete' }) => {
  const [confirm, setConfirm] = useState(false)
  if (confirm) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Sure?</span>
      <button type="button" onClick={() => { setConfirm(false); onClick() }}
        style={{ padding: '3px 10px', borderRadius: 6, border: '1px solid #ef444460', background: '#ef444415', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
        Yes
      </button>
      <button type="button" onClick={() => setConfirm(false)}
        style={{ padding: '3px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer' }}>
        No
      </button>
    </div>
  )
  return (
    <button type="button" onClick={() => setConfirm(true)} title={label}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, border: '1px solid transparent', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', transition: 'all 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.border = '1px solid #ef444450'; e.currentTarget.style.background = '#ef444410'; e.currentTarget.style.color = '#ef4444' }}
      onMouseLeave={e => { e.currentTarget.style.border = '1px solid transparent'; e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)' }}>
      <Trash2 size={13} />{label}
    </button>
  )
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const emptyProject = { title: '', type: 'major', description: '', techStack: '', githubLink: '', year: new Date().getFullYear() }
const emptyCert    = { title: '', issuedBy: '', issueDate: '', credentialId: '' }
const emptyIntern  = { company: '', role: '', startDate: '', endDate: '', stipend: '', description: '', isCompleted: false }

const emptyPersonal = {
  phone: '', email: '', dateOfBirth: '', gender: '', bloodGroup: '',
  aadharNumber: '', passportPhotoUrl: '',
  address: { street: '', city: '', state: '', pincode: '' },
  parentInfo: {
    fatherName: '', fatherOccupation: '', fatherPhone: '',
    motherName: '', motherOccupation: '', motherPhone: '',
    guardianName: '', guardianPhone: '', annualIncome: ''
  }
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function UpdateProfile() {
  const { user } = useAuth()

  // personal
  const [personal, setPersonal] = useState(emptyPersonal)

  // skills
  const [technicalSkills,      setTechSkills]  = useState([])
  const [softSkills,           setSoftSkills]  = useState([])
  const [programmingLanguages, setProgLangs]   = useState([])
  const [achievements,         setAchievements]= useState([])

  // arrays
  const [projects,      setProjects]     = useState([])
  const [certifications,setCerts]        = useState([])
  const [internships,   setInternships]  = useState([])

  // social
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [githubUrl,   setGithubUrl]   = useState('')

  // new-item drafts
  const [newProject, setNewProject] = useState(emptyProject)
  const [newCert,    setNewCert]    = useState(emptyCert)
  const [newIntern,  setNewIntern]  = useState(emptyIntern)

  // section open/close
  const [open, setOpen] = useState({ personal: true, links: false, skills: false, projects: false, certs: false, internships: false, achievements: false })
  const toggle = (k) => setOpen(o => ({ ...o, [k]: !o[k] }))

  // saving states
  const [loading,         setLoading]         = useState(true)
  const [savingPersonal,  setSavingPersonal]  = useState(false)
  const [savingSkills,    setSavingSkills]    = useState(false)
  const [savingLinks,     setSavingLinks]     = useState(false)
  const [savingProject,   setSavingProject]   = useState(false)
  const [savingCert,      setSavingCert]      = useState(false)
  const [savingIntern,    setSavingIntern]    = useState(false)
  const [deletingProject, setDeletingProject] = useState(null)
  const [deletingCert,    setDeletingCert]    = useState(null)
  const [deletingIntern,  setDeletingIntern]  = useState(null)

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!user?.enrollmentNumber) return
        const { data } = await API.get(`/students/${user.enrollmentNumber}`)
        const s = data.data
        setPersonal({
          phone:            s.phone            || '',
          email:            s.email            || '',
          dateOfBirth:      s.dateOfBirth ? s.dateOfBirth.slice(0, 10) : '',
          gender:           s.gender           || '',
          bloodGroup:       s.bloodGroup       || '',
          aadharNumber:     s.aadharNumber     || '',
          passportPhotoUrl: s.passportPhotoUrl || '',
          address: {
            street:  s.address?.street  || '',
            city:    s.address?.city    || '',
            state:   s.address?.state   || '',
            pincode: s.address?.pincode || '',
          },
          parentInfo: {
            fatherName:       s.parentInfo?.fatherName       || '',
            fatherOccupation: s.parentInfo?.fatherOccupation || '',
            fatherPhone:      s.parentInfo?.fatherPhone      || '',
            motherName:       s.parentInfo?.motherName       || '',
            motherOccupation: s.parentInfo?.motherOccupation || '',
            motherPhone:      s.parentInfo?.motherPhone      || '',
            guardianName:     s.parentInfo?.guardianName     || '',
            guardianPhone:    s.parentInfo?.guardianPhone    || '',
            annualIncome:     s.parentInfo?.annualIncome     || '',
          }
        })
        setTechSkills(s.technicalSkills      || [])
        setSoftSkills(s.softSkills           || [])
        setProgLangs(s.programmingLanguages  || [])
        setAchievements(s.achievements       || [])
        setProjects(s.projects               || [])
        setCerts(s.certifications            || [])
        setInternships(s.internships         || [])
        setLinkedinUrl(s.linkedinUrl         || '')
        setGithubUrl(s.githubUrl             || '')
      } catch { toast.error('Failed to load profile') }
      finally { setLoading(false) }
    }
    fetchProfile()
  }, [user])

  // ── Helper: nested personal field setter ──────────────────────────────────
  const setAddr    = (k, v) => setPersonal(p => ({ ...p, address:    { ...p.address,    [k]: v } }))
  const setParent  = (k, v) => setPersonal(p => ({ ...p, parentInfo: { ...p.parentInfo, [k]: v } }))

  // ── Save personal info ─────────────────────────────────────────────────────
  const savePersonal = async () => {
    setSavingPersonal(true)
    try {
      const payload = {
        phone:            personal.phone,
        email:            personal.email,
        dateOfBirth:      personal.dateOfBirth || undefined,
        gender:           personal.gender      || undefined,
        bloodGroup:       personal.bloodGroup  || undefined,
        aadharNumber:     personal.aadharNumber,
        passportPhotoUrl: personal.passportPhotoUrl,
        address:          personal.address,
        parentInfo: {
          ...personal.parentInfo,
          annualIncome: personal.parentInfo.annualIncome ? Number(personal.parentInfo.annualIncome) : undefined
        }
      }
      await API.put(`/students/${user.enrollmentNumber}`, payload)
      toast.success('Personal info saved!')
    } catch (err) { toast.error(err?.response?.data?.message || 'Save failed') }
    finally { setSavingPersonal(false) }
  }

  // ── Save skills ────────────────────────────────────────────────────────────
  const saveSkills = async () => {
    setSavingSkills(true)
    try {
      await API.put(`/students/${user.enrollmentNumber}`, {
        technicalSkills, softSkills, programmingLanguages, achievements
      })
      toast.success('Saved!')
    } catch (err) { toast.error(err?.response?.data?.message || 'Save failed') }
    finally { setSavingSkills(false) }
  }

  // ── Save links ─────────────────────────────────────────────────────────────
  const saveLinks = async () => {
    setSavingLinks(true)
    try {
      await API.put(`/students/${user.enrollmentNumber}`, { linkedinUrl, githubUrl })
      toast.success('Links saved!')
    } catch (err) { toast.error(err?.response?.data?.message || 'Save failed') }
    finally { setSavingLinks(false) }
  }

  // ── Projects ───────────────────────────────────────────────────────────────
  const handleAddProject = async (e) => {
    e.preventDefault(); setSavingProject(true)
    try {
      const payload = { ...newProject, year: parseInt(newProject.year), techStack: newProject.techStack.split(',').map(s => s.trim()).filter(Boolean) }
      const { data } = await API.post(`/students/${user.enrollmentNumber}/projects`, payload)
      setProjects(data.data); setNewProject(emptyProject); toast.success('Project added!')
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed') }
    finally { setSavingProject(false) }
  }

  const handleDeleteProject = async (index) => {
    setDeletingProject(index)
    try {
      const { data } = await API.delete(`/students/${user.enrollmentNumber}/projects/${index}`)
      setProjects(data.data); toast.success('Project removed')
    } catch {
      try {
        const updated = projects.filter((_, i) => i !== index)
        await API.put(`/students/${user.enrollmentNumber}`, { projects: updated })
        setProjects(updated); toast.success('Project removed')
      } catch (err) { toast.error(err?.response?.data?.message || 'Delete failed') }
    } finally { setDeletingProject(null) }
  }

  // ── Certifications ─────────────────────────────────────────────────────────
  const handleAddCert = async (e) => {
    e.preventDefault(); setSavingCert(true)
    try {
      const { data } = await API.post(`/students/${user.enrollmentNumber}/certifications`, newCert)
      setCerts(data.data); setNewCert(emptyCert); toast.success('Certification added!')
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed') }
    finally { setSavingCert(false) }
  }

  const handleDeleteCert = async (index) => {
    setDeletingCert(index)
    try {
      const { data } = await API.delete(`/students/${user.enrollmentNumber}/certifications/${index}`)
      setCerts(data.data); toast.success('Certification removed')
    } catch {
      try {
        const updated = certifications.filter((_, i) => i !== index)
        await API.put(`/students/${user.enrollmentNumber}`, { certifications: updated })
        setCerts(updated); toast.success('Certification removed')
      } catch (err) { toast.error(err?.response?.data?.message || 'Delete failed') }
    } finally { setDeletingCert(null) }
  }

  // ── Internships ────────────────────────────────────────────────────────────
  const handleAddIntern = async (e) => {
    e.preventDefault(); setSavingIntern(true)
    try {
      const updated = [...internships, { ...newIntern, stipend: parseFloat(newIntern.stipend) || 0 }]
      await API.put(`/students/${user.enrollmentNumber}`, { internships: updated })
      setInternships(updated); setNewIntern(emptyIntern); toast.success('Internship added!')
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed') }
    finally { setSavingIntern(false) }
  }

  const handleDeleteIntern = async (index) => {
    setDeletingIntern(index)
    try {
      const updated = internships.filter((_, i) => i !== index)
      await API.put(`/students/${user.enrollmentNumber}`, { internships: updated })
      setInternships(updated); toast.success('Internship removed')
    } catch (err) { toast.error(err?.response?.data?.message || 'Delete failed') }
    finally { setDeletingIntern(null) }
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
      <div className="spinner" /><span style={{ color: 'var(--text-muted)' }}>Loading…</span>
    </div>
  )

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="page-enter" style={{ maxWidth: 780, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Update Profile</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>Keep your profile updated to improve your AI Readiness Score</p>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          1. PERSONAL INFORMATION
      ══════════════════════════════════════════════════════════════════ */}
      <div className="card" style={{ marginBottom: 16 }}>
        <SectionHeader icon={User} title="Personal Information" color="var(--accent)" open={open.personal} onToggle={() => toggle('personal')} />
        {open.personal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Passport photo preview + URL */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
              <div style={{
                width: 80, height: 96, borderRadius: 10, flexShrink: 0,
                background: 'var(--bg-elevated)', border: '2px dashed var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
              }}>
                {personal.passportPhotoUrl
                  ? <img src={personal.passportPhotoUrl} alt="passport" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <User size={28} color="var(--text-muted)" />}
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Passport Photo URL</label>
                <input className="form-input" placeholder="https://res.cloudinary.com/…"
                  value={personal.passportPhotoUrl}
                  onChange={e => setPersonal(p => ({ ...p, passportPhotoUrl: e.target.value }))} />
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Upload your photo to Cloudinary / any image host, paste the URL here.
                </p>
              </div>
            </div>

            {/* Basic info row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input className="form-input" placeholder="10-digit mobile number"
                  value={personal.phone}
                  onChange={e => setPersonal(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" placeholder="you@example.com"
                  value={personal.email}
                  onChange={e => setPersonal(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input type="date" className="form-input"
                  value={personal.dateOfBirth}
                  onChange={e => setPersonal(p => ({ ...p, dateOfBirth: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select className="form-input" value={personal.gender}
                  onChange={e => setPersonal(p => ({ ...p, gender: e.target.value }))}>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Blood Group</label>
                <select className="form-input" value={personal.bloodGroup}
                  onChange={e => setPersonal(p => ({ ...p, bloodGroup: e.target.value }))}>
                  <option value="">Select</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Aadhar Number</label>
                <input className="form-input" placeholder="12-digit Aadhar"
                  maxLength={12}
                  value={personal.aadharNumber}
                  onChange={e => setPersonal(p => ({ ...p, aadharNumber: e.target.value.replace(/\D/g, '') }))} />
              </div>
            </div>

            {/* Address */}
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Home size={12} /> Address
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Street / House No.</label>
                  <input className="form-input" placeholder="e.g. 42, MG Road, Sector 5"
                    value={personal.address.street}
                    onChange={e => setAddr('street', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input className="form-input" placeholder="e.g. Indore"
                    value={personal.address.city}
                    onChange={e => setAddr('city', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input className="form-input" placeholder="e.g. Madhya Pradesh"
                    value={personal.address.state}
                    onChange={e => setAddr('state', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Pincode</label>
                  <input className="form-input" placeholder="e.g. 452001"
                    maxLength={6}
                    value={personal.address.pincode}
                    onChange={e => setAddr('pincode', e.target.value.replace(/\D/g, ''))} />
                </div>
              </div>
            </div>

            {/* Parent / Guardian info */}
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
                Parent / Guardian Information
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Father's Name</label>
                  <input className="form-input" placeholder="Full name"
                    value={personal.parentInfo.fatherName}
                    onChange={e => setParent('fatherName', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Father's Occupation</label>
                  <input className="form-input" placeholder="e.g. Business"
                    value={personal.parentInfo.fatherOccupation}
                    onChange={e => setParent('fatherOccupation', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Father's Phone</label>
                  <input className="form-input" placeholder="10-digit number"
                    value={personal.parentInfo.fatherPhone}
                    onChange={e => setParent('fatherPhone', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Mother's Name</label>
                  <input className="form-input" placeholder="Full name"
                    value={personal.parentInfo.motherName}
                    onChange={e => setParent('motherName', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Mother's Occupation</label>
                  <input className="form-input" placeholder="e.g. Homemaker"
                    value={personal.parentInfo.motherOccupation}
                    onChange={e => setParent('motherOccupation', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Mother's Phone</label>
                  <input className="form-input" placeholder="10-digit number"
                    value={personal.parentInfo.motherPhone}
                    onChange={e => setParent('motherPhone', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Annual Family Income (₹)</label>
                  <input type="number" className="form-input" placeholder="e.g. 500000"
                    value={personal.parentInfo.annualIncome}
                    onChange={e => setParent('annualIncome', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Guardian Name <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(if different)</span></label>
                  <input className="form-input" placeholder="Optional"
                    value={personal.parentInfo.guardianName}
                    onChange={e => setParent('guardianName', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Guardian Phone</label>
                  <input className="form-input" placeholder="Optional"
                    value={personal.parentInfo.guardianPhone}
                    onChange={e => setParent('guardianPhone', e.target.value)} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-primary" onClick={savePersonal} disabled={savingPersonal}>
                {savingPersonal
                  ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving…</>
                  : <><Save size={14} /> Save Personal Info</>}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          2. SOCIAL LINKS
      ══════════════════════════════════════════════════════════════════ */}
      <div className="card" style={{ marginBottom: 16 }}>
        <SectionHeader icon={Link} title="Social Links" color="var(--text-muted)" open={open.links} onToggle={() => toggle('links')} />
        {open.links && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">LinkedIn URL</label>
                <input className="form-input" placeholder="https://linkedin.com/in/yourname"
                  value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">GitHub URL</label>
                <input className="form-input" placeholder="https://github.com/yourname"
                  value={githubUrl} onChange={e => setGithubUrl(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-primary" onClick={saveLinks} disabled={savingLinks}>
                {savingLinks ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving…</> : <><Save size={14} /> Save Links</>}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          3. SKILLS & LANGUAGES
      ══════════════════════════════════════════════════════════════════ */}
      <div className="card" style={{ marginBottom: 16 }}>
        <SectionHeader icon={Code2} title="Skills & Languages" color="var(--accent)" open={open.skills} onToggle={() => toggle('skills')} />
        {open.skills && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <TagInput label="Technical Skills" values={technicalSkills} onChange={setTechSkills} placeholder="Type skill + Enter  e.g. React" />
            <TagInput label="Programming Languages" values={programmingLanguages} onChange={setProgLangs} placeholder="Type language + Enter  e.g. Python" />
            <TagInput label="Soft Skills" values={softSkills} onChange={setSoftSkills} placeholder="e.g. Leadership" />
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-primary" onClick={saveSkills} disabled={savingSkills}>
                {savingSkills ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving…</> : <><Save size={14} /> Save Skills</>}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          4. PROJECTS
      ══════════════════════════════════════════════════════════════════ */}
      <div className="card" style={{ marginBottom: 16 }}>
        <SectionHeader icon={FolderGit2} title={`Projects (${projects.length})`} color="var(--blue)" open={open.projects} onToggle={() => toggle('projects')} />
        {open.projects && (
          <>
            {projects.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {projects.map((p, i) => (
                  <div key={i} style={{ padding: '14px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>{p.title}</span>
                        <span className={`badge ${p.type === 'major' ? 'badge-amber' : 'badge-blue'}`}>{p.type}</span>
                        {p.year && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.year}</span>}
                      </div>
                      {deletingProject === i
                        ? <div className="spinner" style={{ width: 14, height: 14, flexShrink: 0 }} />
                        : <DeleteButton onClick={() => handleDeleteProject(i)} label="Remove" />}
                    </div>
                    {p.description && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>{p.description}</p>}
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {p.techStack?.map(t => <span key={t} className="chip" style={{ fontSize: '0.7rem' }}>{t}</span>)}
                    </div>
                    {p.githubLink && <a href={p.githubLink} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 8, fontSize: '0.75rem', color: 'var(--accent)' }}>GitHub →</a>}
                  </div>
                ))}
              </div>
            )}
            <div style={{ borderTop: projects.length > 0 ? '1px solid var(--border)' : 'none', paddingTop: projects.length > 0 ? 20 : 0 }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Add New Project</p>
              <form onSubmit={handleAddProject} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Title *</label>
                    <input required className="form-input" placeholder="e.g. E-Commerce Website"
                      value={newProject.title} onChange={e => setNewProject({ ...newProject, title: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select className="form-input" value={newProject.type} onChange={e => setNewProject({ ...newProject, type: e.target.value })}>
                      <option value="major">Major</option>
                      <option value="minor">Minor</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tech Stack (comma separated)</label>
                    <input className="form-input" placeholder="React, Node.js, MongoDB"
                      value={newProject.techStack} onChange={e => setNewProject({ ...newProject, techStack: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Year</label>
                    <input type="number" className="form-input" min="2018" max="2030"
                      value={newProject.year} onChange={e => setNewProject({ ...newProject, year: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-input" rows={2} placeholder="Brief description…"
                    value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} style={{ resize: 'vertical' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">GitHub Link</label>
                  <input className="form-input" placeholder="https://github.com/…"
                    value={newProject.githubLink} onChange={e => setNewProject({ ...newProject, githubLink: e.target.value })} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" disabled={savingProject}>
                    {savingProject ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Adding…</> : <><Plus size={14} /> Add Project</>}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          5. CERTIFICATIONS
      ══════════════════════════════════════════════════════════════════ */}
      <div className="card" style={{ marginBottom: 16 }}>
        <SectionHeader icon={Award} title={`Certifications (${certifications.length})`} color="var(--green)" open={open.certs} onToggle={() => toggle('certs')} />
        {open.certs && (
          <>
            {certifications.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {certifications.map((c, i) => (
                  <div key={i} style={{ padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.875rem' }}>{c.title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{c.issuedBy}{c.issueDate && ` · ${c.issueDate.slice(0, 7)}`}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="badge badge-green">Certified</span>
                      {deletingCert === i
                        ? <div className="spinner" style={{ width: 14, height: 14 }} />
                        : <DeleteButton onClick={() => handleDeleteCert(i)} />}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ borderTop: certifications.length > 0 ? '1px solid var(--border)' : 'none', paddingTop: certifications.length > 0 ? 20 : 0 }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Add New Certification</p>
              <form onSubmit={handleAddCert} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Certificate Title *</label>
                    <input required className="form-input" placeholder="e.g. AWS Cloud Practitioner"
                      value={newCert.title} onChange={e => setNewCert({ ...newCert, title: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Issued By</label>
                    <input className="form-input" placeholder="e.g. Amazon Web Services"
                      value={newCert.issuedBy} onChange={e => setNewCert({ ...newCert, issuedBy: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Issue Date</label>
                    <input type="date" className="form-input"
                      value={newCert.issueDate} onChange={e => setNewCert({ ...newCert, issueDate: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Credential ID</label>
                    <input className="form-input" placeholder="Optional"
                      value={newCert.credentialId} onChange={e => setNewCert({ ...newCert, credentialId: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" disabled={savingCert}>
                    {savingCert ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Adding…</> : <><Plus size={14} /> Add Certification</>}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          6. INTERNSHIPS
      ══════════════════════════════════════════════════════════════════ */}
      <div className="card" style={{ marginBottom: 16 }}>
        <SectionHeader icon={Briefcase} title={`Internships (${internships.length})`} color="var(--purple)" open={open.internships} onToggle={() => toggle('internships')} />
        {open.internships && (
          <>
            {internships.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {internships.map((n, i) => (
                  <div key={i} style={{ padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.875rem' }}>{n.role}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>@ {n.company}</span>
                          {n.isCompleted && <span className="badge badge-green">Completed</span>}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {n.startDate?.slice(0, 7)} → {n.endDate?.slice(0, 7)}{n.stipend > 0 && ` · ₹${n.stipend}/month`}
                        </div>
                      </div>
                      {deletingIntern === i
                        ? <div className="spinner" style={{ width: 14, height: 14 }} />
                        : <DeleteButton onClick={() => handleDeleteIntern(i)} />}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ borderTop: internships.length > 0 ? '1px solid var(--border)' : 'none', paddingTop: internships.length > 0 ? 20 : 0 }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Add New Internship</p>
              <form onSubmit={handleAddIntern} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Company *</label>
                    <input required className="form-input" placeholder="e.g. TCS"
                      value={newIntern.company} onChange={e => setNewIntern({ ...newIntern, company: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <input className="form-input" placeholder="e.g. Web Developer Intern"
                      value={newIntern.role} onChange={e => setNewIntern({ ...newIntern, role: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input type="date" className="form-input"
                      value={newIntern.startDate} onChange={e => setNewIntern({ ...newIntern, startDate: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input type="date" className="form-input"
                      value={newIntern.endDate} onChange={e => setNewIntern({ ...newIntern, endDate: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Stipend (₹/month)</label>
                    <input type="number" className="form-input" placeholder="e.g. 10000"
                      value={newIntern.stipend} onChange={e => setNewIntern({ ...newIntern, stipend: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-input" value={String(newIntern.isCompleted)}
                      onChange={e => setNewIntern({ ...newIntern, isCompleted: e.target.value === 'true' })}>
                      <option value="false">Ongoing</option>
                      <option value="true">Completed</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-input" rows={2} placeholder="What you worked on…"
                    value={newIntern.description} onChange={e => setNewIntern({ ...newIntern, description: e.target.value })} style={{ resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" disabled={savingIntern}>
                    {savingIntern ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Adding…</> : <><Plus size={14} /> Add Internship</>}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          7. ACHIEVEMENTS
      ══════════════════════════════════════════════════════════════════ */}
      <div className="card" style={{ marginBottom: 16 }}>
        <SectionHeader icon={Award} title={`Achievements (${achievements.length})`} color="var(--amber)" open={open.achievements} onToggle={() => toggle('achievements')} />
        {open.achievements && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {achievements.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
                {achievements.map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{a}</span>
                    <button type="button" onClick={() => setAchievements(achievements.filter((_, j) => j !== i))}
                      style={{ color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}>
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <TagInput values={achievements} onChange={setAchievements} placeholder="e.g. Won Hackathon 2024" />
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-primary" onClick={saveSkills} disabled={savingSkills}>
                {savingSkills ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saving…</> : <><Save size={14} /> Save Achievements</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}