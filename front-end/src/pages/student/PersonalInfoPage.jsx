import React, { useEffect, useState } from 'react'
import { useAuth, API } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import {
  User, Phone, MapPin, Heart, Users, BookOpen,
  Save, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Shield
} from 'lucide-react'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
const CATEGORIES   = ['General', 'OBC', 'SC', 'ST', 'EWS', 'Other']
const GENDERS      = ['Male', 'Female', 'Other', 'Prefer not to say']
const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','J&K','Ladakh','Other'
]

const emptyAddress = { line1:'', line2:'', city:'', state:'', pincode:'', country:'India' }

const emptyForm = {
  fullName:'', dateOfBirth:'', gender:'', bloodGroup:'', nationality:'Indian',
  religion:'', category:'', aadharNumber:'',
  personalEmail:'', mobileNumber:'', alternateMobile:'',
  fatherName:'', fatherOccupation:'', fatherMobile:'',
  motherName:'', motherOccupation:'', motherMobile:'',
  guardianName:'', guardianRelation:'', guardianMobile:'', annualFamilyIncome:'',
  permanentAddress: { ...emptyAddress },
  temporaryAddress: { ...emptyAddress },
  sameAsPermanent: false,
  admissionYear:'', rollNumber:'', hostelResident:false, hostelBlock:'', busRoute:'',
  emergencyContactName:'', emergencyContactPhone:'', emergencyContactRelation:'',
}

function Field({ label, required, children, hint }) {
  return (
    <div className="form-group">
      <label className="form-label">
        {label}{required && <span style={{ color:'var(--red)', marginLeft:2 }}>*</span>}
      </label>
      {children}
      {hint && <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginTop:3 }}>{hint}</div>}
    </div>
  )
}

function SectionCard({ icon: Icon, title, color='var(--accent)', bg, open, onToggle, children }) {
  return (
    <div className="card" style={{ marginBottom:16, padding:0, overflow:'hidden' }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'18px 24px', background:'none', border:'none', cursor:'pointer',
          borderBottom: open ? '1px solid var(--border)' : 'none',
        }}
      >
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{
            width:36, height:36, borderRadius:10,
            background: bg || `${color}18`,
            border:`1px solid ${color}30`,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <Icon size={16} color={color} strokeWidth={2} />
          </div>
          <span style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'0.95rem', color:'var(--text-primary)' }}>
            {title}
          </span>
        </div>
        {open
          ? <ChevronUp size={16} color="var(--text-muted)" />
          : <ChevronDown size={16} color="var(--text-muted)" />}
      </button>
      {open && (
        <div style={{ padding:'20px 24px' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function AddressBlock({ label, value, onChange }) {
  const upd = (field, val) => onChange({ ...value, [field]: val })
  return (
    <div style={{ marginTop:4 }}>
      {label && <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginBottom:10, fontWeight:600 }}>{label}</div>}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div className="form-group" style={{ gridColumn:'1/-1' }}>
          <label className="form-label">Address Line 1</label>
          <input className="form-input" placeholder="House/Flat No., Street" value={value.line1} onChange={e => upd('line1', e.target.value)} />
        </div>
        <div className="form-group" style={{ gridColumn:'1/-1' }}>
          <label className="form-label">Address Line 2</label>
          <input className="form-input" placeholder="Locality, Landmark" value={value.line2} onChange={e => upd('line2', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">City / District</label>
          <input className="form-input" placeholder="City" value={value.city} onChange={e => upd('city', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">State</label>
          <select className="form-input" value={value.state} onChange={e => upd('state', e.target.value)}>
            <option value="">Select State</option>
            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">PIN Code</label>
          <input className="form-input" placeholder="6-digit PIN" maxLength={6} value={value.pincode} onChange={e => upd('pincode', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Country</label>
          <input className="form-input" value={value.country} onChange={e => upd('country', e.target.value)} />
        </div>
      </div>
    </div>
  )
}

export default function PersonalInfoPage() {
  const { user } = useAuth()
  const [form,    setForm]    = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [isNew,   setIsNew]   = useState(true)
  const [open, setOpen] = useState({
    basic:true, contact:true, parents:false, address:false, academic:false, emergency:false
  })
  const toggle = k => setOpen(o => ({ ...o, [k]: !o[k] }))

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await API.get(`/personal-info/${user.enrollmentNumber}`)
        if (data.data) {
          const d = data.data
          setForm({
            fullName: d.fullName || '', dateOfBirth: d.dateOfBirth || '',
            gender: d.gender || '', bloodGroup: d.bloodGroup || '',
            nationality: d.nationality || 'Indian', religion: d.religion || '',
            category: d.category || '', aadharNumber: d.aadharNumber || '',
            personalEmail: d.personalEmail || '', mobileNumber: d.mobileNumber || '',
            alternateMobile: d.alternateMobile || '',
            fatherName: d.fatherName || '', fatherOccupation: d.fatherOccupation || '',
            fatherMobile: d.fatherMobile || '',
            motherName: d.motherName || '', motherOccupation: d.motherOccupation || '',
            motherMobile: d.motherMobile || '',
            guardianName: d.guardianName || '', guardianRelation: d.guardianRelation || '',
            guardianMobile: d.guardianMobile || '', annualFamilyIncome: d.annualFamilyIncome || '',
            permanentAddress: { ...emptyAddress, ...(d.permanentAddress || {}) },
            temporaryAddress: { ...emptyAddress, ...(d.temporaryAddress || {}) },
            sameAsPermanent: d.sameAsPermanent || false,
            admissionYear: d.admissionYear || '', rollNumber: d.rollNumber || '',
            hostelResident: d.hostelResident || false, hostelBlock: d.hostelBlock || '',
            busRoute: d.busRoute || '',
            emergencyContactName: d.emergencyContactName || '',
            emergencyContactPhone: d.emergencyContactPhone || '',
            emergencyContactRelation: d.emergencyContactRelation || '',
          })
        }
        setIsNew(data.isNew || false)
      } catch { toast.error('Failed to load personal info') }
      finally { setLoading(false) }
    }
    if (user?.enrollmentNumber) load()
  }, [user])

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))
  const setAddr = (type, val) => setForm(f => ({ ...f, [type]: val }))

  const handleSameAsPermanent = (checked) => {
    setForm(f => ({
      ...f,
      sameAsPermanent: checked,
      temporaryAddress: checked ? { ...f.permanentAddress } : { ...emptyAddress }
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await API.put(`/personal-info/${user.enrollmentNumber}`, form)
      toast.success(isNew ? 'Personal info saved!' : 'Personal info updated!')
      setIsNew(false)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', gap:12 }}>
      <div className="spinner" /><span style={{ color:'var(--text-muted)' }}>Loading…</span>
    </div>
  )

  const gridTwo = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }
  const gridThree = { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }

  return (
    <div className="page-enter" style={{ maxWidth:860, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
          <h1 style={{ fontSize:'1.5rem', fontWeight:800, letterSpacing:'-0.03em' }}>Personal Information</h1>
          {!isNew && (
            <span className="badge badge-green" style={{ display:'flex', alignItems:'center', gap:4 }}>
              <CheckCircle size={11} /> Saved
            </span>
          )}
        </div>
        <p style={{ color:'var(--text-muted)', fontSize:'0.875rem' }}>
          Fill in your complete personal details. This information is confidential and only visible to administrators.
        </p>
        <div style={{
          display:'flex', alignItems:'center', gap:8, marginTop:10,
          padding:'10px 14px', background:'var(--accent-glow-lg)',
          border:'1px solid rgba(124,58,237,0.15)', borderRadius:'var(--radius)',
        }}>
          <Shield size={14} color="var(--accent)" />
          <span style={{ fontSize:'0.8rem', color:'var(--accent)', fontWeight:600 }}>
            Your personal data is encrypted and only accessible by department administrators.
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>

        {/* BASIC INFO */}
        <SectionCard icon={User} title="Basic Information" color="var(--accent)" open={open.basic} onToggle={() => toggle('basic')}>
          <div style={gridTwo}>
            <Field label="Full Name (as per documents)" required>
              <input required className="form-input" placeholder="As per Aadhar/Marksheet"
                value={form.fullName} onChange={e => set('fullName', e.target.value)} />
            </Field>
            <Field label="Date of Birth" required>
              <input type="date" required className="form-input"
                value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} />
            </Field>
            <Field label="Gender">
              <select className="form-input" value={form.gender} onChange={e => set('gender', e.target.value)}>
                <option value="">Select Gender</option>
                {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="Blood Group">
              <select className="form-input" value={form.bloodGroup} onChange={e => set('bloodGroup', e.target.value)}>
                <option value="">Select Blood Group</option>
                {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </Field>
            <Field label="Category / Caste">
              <select className="form-input" value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="">Select Category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Religion">
              <input className="form-input" placeholder="e.g. Hindu, Muslim, Christian…"
                value={form.religion} onChange={e => set('religion', e.target.value)} />
            </Field>
            <Field label="Nationality">
              <input className="form-input" value={form.nationality}
                onChange={e => set('nationality', e.target.value)} />
            </Field>
            <Field label="Aadhar Number" hint="12-digit Aadhar (stored securely)">
              <input className="form-input" placeholder="XXXX XXXX XXXX" maxLength={14}
                value={form.aadharNumber} onChange={e => set('aadharNumber', e.target.value)} />
            </Field>
          </div>
        </SectionCard>

        {/* CONTACT */}
        <SectionCard icon={Phone} title="Contact Details" color="var(--blue)" open={open.contact} onToggle={() => toggle('contact')}>
          <div style={gridTwo}>
            <Field label="Personal Email" required>
              <input type="email" required className="form-input" placeholder="personal@email.com"
                value={form.personalEmail} onChange={e => set('personalEmail', e.target.value)} />
            </Field>
            <Field label="Mobile Number" required>
              <input required className="form-input" placeholder="10-digit mobile" maxLength={10}
                value={form.mobileNumber} onChange={e => set('mobileNumber', e.target.value)} />
            </Field>
            <Field label="Alternate Mobile">
              <input className="form-input" placeholder="Alternate number (optional)" maxLength={10}
                value={form.alternateMobile} onChange={e => set('alternateMobile', e.target.value)} />
            </Field>
          </div>
        </SectionCard>

        {/* PARENTS */}
        <SectionCard icon={Users} title="Parents / Guardian Details" color="var(--purple)" open={open.parents} onToggle={() => toggle('parents')}>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:'0.75rem', fontFamily:'var(--font-display)', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>
              Father's Details
            </div>
            <div style={gridThree}>
              <Field label="Father's Name">
                <input className="form-input" placeholder="Full name" value={form.fatherName} onChange={e => set('fatherName', e.target.value)} />
              </Field>
              <Field label="Occupation">
                <input className="form-input" placeholder="e.g. Farmer, Engineer" value={form.fatherOccupation} onChange={e => set('fatherOccupation', e.target.value)} />
              </Field>
              <Field label="Mobile">
                <input className="form-input" placeholder="Father's mobile" maxLength={10} value={form.fatherMobile} onChange={e => set('fatherMobile', e.target.value)} />
              </Field>
            </div>
          </div>

          <div style={{ marginBottom:20, paddingTop:16, borderTop:'1px solid var(--border)' }}>
            <div style={{ fontSize:'0.75rem', fontFamily:'var(--font-display)', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>
              Mother's Details
            </div>
            <div style={gridThree}>
              <Field label="Mother's Name">
                <input className="form-input" placeholder="Full name" value={form.motherName} onChange={e => set('motherName', e.target.value)} />
              </Field>
              <Field label="Occupation">
                <input className="form-input" placeholder="e.g. Homemaker, Teacher" value={form.motherOccupation} onChange={e => set('motherOccupation', e.target.value)} />
              </Field>
              <Field label="Mobile">
                <input className="form-input" placeholder="Mother's mobile" maxLength={10} value={form.motherMobile} onChange={e => set('motherMobile', e.target.value)} />
              </Field>
            </div>
          </div>

          <div style={{ paddingTop:16, borderTop:'1px solid var(--border)' }}>
            <div style={{ fontSize:'0.75rem', fontFamily:'var(--font-display)', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>
              Annual Family Income &amp; Guardian (if applicable)
            </div>
            <div style={gridTwo}>
              <Field label="Annual Family Income">
                <select className="form-input" value={form.annualFamilyIncome} onChange={e => set('annualFamilyIncome', e.target.value)}>
                  <option value="">Select Range</option>
                  {['Below 1 Lakh','1-2.5 Lakh','2.5-5 Lakh','5-10 Lakh','10-25 Lakh','Above 25 Lakh'].map(r =>
                    <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="Guardian Name (if different)">
                <input className="form-input" placeholder="Guardian name" value={form.guardianName} onChange={e => set('guardianName', e.target.value)} />
              </Field>
              <Field label="Guardian Relation">
                <input className="form-input" placeholder="e.g. Uncle, Grandparent" value={form.guardianRelation} onChange={e => set('guardianRelation', e.target.value)} />
              </Field>
              <Field label="Guardian Mobile">
                <input className="form-input" placeholder="Guardian's mobile" maxLength={10} value={form.guardianMobile} onChange={e => set('guardianMobile', e.target.value)} />
              </Field>
            </div>
          </div>
        </SectionCard>

        {/* ADDRESS */}
        <SectionCard icon={MapPin} title="Address Details" color="var(--green)" open={open.address} onToggle={() => toggle('address')}>
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:'0.78rem', fontFamily:'var(--font-display)', fontWeight:700, color:'var(--text-secondary)', marginBottom:14 }}>
              🏡 Permanent Address
            </div>
            <AddressBlock
              value={form.permanentAddress}
              onChange={val => {
                setAddr('permanentAddress', val)
                if (form.sameAsPermanent) setAddr('temporaryAddress', val)
              }}
            />
          </div>

          <div style={{ paddingTop:20, borderTop:'1px solid var(--border)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div style={{ fontSize:'0.78rem', fontFamily:'var(--font-display)', fontWeight:700, color:'var(--text-secondary)' }}>
                🏙️ Temporary / Current Address
              </div>
              <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:'0.8rem', color:'var(--text-muted)', cursor:'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.sameAsPermanent}
                  onChange={e => handleSameAsPermanent(e.target.checked)}
                  style={{ accentColor:'var(--accent)', width:14, height:14 }}
                />
                Same as Permanent
              </label>
            </div>
            {!form.sameAsPermanent && (
              <AddressBlock
                value={form.temporaryAddress}
                onChange={val => setAddr('temporaryAddress', val)}
              />
            )}
            {form.sameAsPermanent && (
              <div style={{ padding:'12px 16px', background:'var(--bg-elevated)', borderRadius:'var(--radius)', fontSize:'0.82rem', color:'var(--text-muted)', border:'1px solid var(--border)' }}>
                ✓ Same as permanent address
              </div>
            )}
          </div>
        </SectionCard>

        {/* ACADEMIC */}
        <SectionCard icon={BookOpen} title="Academic / Hostel Details" color="var(--amber)" open={open.academic} onToggle={() => toggle('academic')}>
          <div style={gridThree}>
            <Field label="Admission Year">
              <input className="form-input" placeholder="e.g. 2022"
                value={form.admissionYear} onChange={e => set('admissionYear', e.target.value)} />
            </Field>
            <Field label="College Roll Number">
              <input className="form-input" placeholder="Roll no. if different"
                value={form.rollNumber} onChange={e => set('rollNumber', e.target.value)} />
            </Field>
            <Field label="Bus Route (if applicable)">
              <input className="form-input" placeholder="Route no. / stop name"
                value={form.busRoute} onChange={e => set('busRoute', e.target.value)} />
            </Field>
          </div>
          <div style={{ marginTop:14, display:'grid', gridTemplateColumns:'auto 1fr', gap:16, alignItems:'start' }}>
            <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:'0.875rem', color:'var(--text-primary)', cursor:'pointer', marginTop:28 }}>
              <input
                type="checkbox"
                checked={form.hostelResident}
                onChange={e => set('hostelResident', e.target.checked)}
                style={{ accentColor:'var(--accent)', width:15, height:15 }}
              />
              Hostel Resident
            </label>
            {form.hostelResident && (
              <Field label="Hostel Block / Room">
                <input className="form-input" placeholder="e.g. Block A, Room 204"
                  value={form.hostelBlock} onChange={e => set('hostelBlock', e.target.value)} />
              </Field>
            )}
          </div>
        </SectionCard>

        {/* EMERGENCY */}
        <SectionCard icon={Heart} title="Emergency Contact" color="var(--red)" open={open.emergency} onToggle={() => toggle('emergency')}>
          <div style={gridThree}>
            <Field label="Contact Person Name" required>
              <input required className="form-input" placeholder="Name of emergency contact"
                value={form.emergencyContactName} onChange={e => set('emergencyContactName', e.target.value)} />
            </Field>
            <Field label="Contact Number" required>
              <input required className="form-input" placeholder="Mobile number" maxLength={10}
                value={form.emergencyContactPhone} onChange={e => set('emergencyContactPhone', e.target.value)} />
            </Field>
            <Field label="Relation">
              <input className="form-input" placeholder="e.g. Father, Mother, Sibling"
                value={form.emergencyContactRelation} onChange={e => set('emergencyContactRelation', e.target.value)} />
            </Field>
          </div>
          <div style={{
            marginTop:14, padding:'10px 14px',
            background:'var(--red-dim)', border:'1px solid rgba(220,38,38,0.2)',
            borderRadius:'var(--radius)', display:'flex', gap:8, alignItems:'flex-start'
          }}>
            <AlertCircle size={14} color="var(--red)" style={{ flexShrink:0, marginTop:2 }} />
            <span style={{ fontSize:'0.78rem', color:'var(--red)' }}>
              This person will be contacted by the college in case of any emergency. Please ensure the number is reachable.
            </span>
          </div>
        </SectionCard>

        {/* SUBMIT */}
        <div style={{ display:'flex', justifyContent:'flex-end', gap:12, marginTop:8, paddingTop:16 }}>
          <button type="submit" className="btn btn-primary" disabled={saving}
            style={{ minWidth:180, justifyContent:'center', padding:'12px 24px' }}>
            {saving
              ? <><div className="spinner" style={{ width:14, height:14 }} /> Saving…</>
              : <><Save size={15} /> Save Personal Info</>}
          </button>
        </div>
      </form>
    </div>
  )
}
