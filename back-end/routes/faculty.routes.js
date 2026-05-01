// ─────────────────────────────────────────────────────────────────────────────
// routes/faculty.js  — full file with attendance criteria endpoints added
// ─────────────────────────────────────────────────────────────────────────────
const express  = require('express')
const router   = express.Router()
const multer   = require('multer')
const path     = require('path')
const fs       = require('fs')
const jwt      = require('jsonwebtoken')

// models
const Faculty            = require('../models/Faculty')
const Student            = require('../models/Student')
const AttendanceRecord = require('../models/Attendance')   // your existing model
const AttendanceCriteria = require('../models/AttendanceCriteria') // NEW model
const Document           = require('../models/Document')           // your existing model

// ── multer setup (reuse your existing config) ─────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`)
  },
})
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } })

// ── auth middleware ───────────────────────────────────────────────────────────
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'No token' })
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const faculty = await Faculty.findOne({ email, isActive: true })
    if (!faculty) return res.status(401).json({ message: 'Invalid credentials' })

    const bcrypt = require('bcryptjs')
    const ok = await bcrypt.compare(password, faculty.password)
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' })

    const token = jwt.sign(
      { id: faculty._id, facultyId: faculty.facultyId, role: 'faculty' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    res.json({
      token,
      user: {
        id: faculty._id,
        name: faculty.name,
        email: faculty.email,
        role: 'faculty',
        facultyId: faculty.facultyId,
      },
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────────────────────
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.user.id).select('-password')
    if (!faculty) return res.status(404).json({ message: 'Faculty not found' })
    res.json({ data: faculty })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// STUDENTS (faculty's division)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/students', authMiddleware, async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.user.id)
    if (!faculty) return res.status(404).json({ message: 'Faculty not found' })

    const filter = { isActive: true }
    if (faculty.division) filter.division = faculty.division

    const students = await Student.find(filter)
      .select('enrollmentNumber name division semester cgpa placementStatus')
      .sort({ enrollmentNumber: 1 })

    res.json({ data: students })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE — GET (by month)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/attendance', authMiddleware, async (req, res) => {
  try {
    const faculty  = await Faculty.findById(req.user.id)
    const { month } = req.query // e.g. "2026-04"

    const filter = { facultyId: req.user.id }

    if (month) {
      const [year, m] = month.split('-').map(Number)
      const start = new Date(year, m - 1, 1)
      const end   = new Date(year, m, 1)
      filter.date = { $gte: start.toISOString().split('T')[0], $lt: end.toISOString().split('T')[0] }
    }

    const records = await AttendanceRecord.find(filter).sort({ date: 1 })
    res.json({ data: records })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE — POST (save one date)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/attendance', authMiddleware, async (req, res) => {
  try {
    const { date, records } = req.body
    if (!date || !records?.length)
      return res.status(400).json({ message: 'date and records are required' })

    // upsert: replace entire day's attendance
    await AttendanceRecord.findOneAndUpdate(
      { facultyId: req.user.id, date },
      { facultyId: req.user.id, date, records },
      { upsert: true, new: true }
    )

    res.json({ message: 'Attendance saved successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE CRITERIA — GET
// ─────────────────────────────────────────────────────────────────────────────
router.get('/attendance/criteria/:subjectCode', authMiddleware, async (req, res) => {
  try {
    const criteria = await AttendanceCriteria.findOne({
      facultyId:   String(req.user.id),
      subjectCode: req.params.subjectCode,
    })

    // return saved or sensible defaults
    res.json({
      data: criteria || {
        minPercentage:   75,
        countLeave:      false,
        countHoliday:    false,
        medicalOverride: true,
      },
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE CRITERIA — PUT (save / update)
// ─────────────────────────────────────────────────────────────────────────────
router.put('/attendance/criteria/:subjectCode', authMiddleware, async (req, res) => {
  try {
    const { minPercentage, countLeave, countHoliday, medicalOverride } = req.body

    // validate
    if (
      typeof minPercentage !== 'number' ||
      minPercentage < 1 ||
      minPercentage > 100
    ) {
      return res.status(400).json({ message: 'minPercentage must be between 1 and 100' })
    }

    const criteria = await AttendanceCriteria.findOneAndUpdate(
      {
        facultyId:   String(req.user.id),
        subjectCode: req.params.subjectCode,
      },
      {
        facultyId:       String(req.user.id),
        subjectCode:     req.params.subjectCode,
        minPercentage,
        countLeave:      Boolean(countLeave),
        countHoliday:    Boolean(countHoliday),
        medicalOverride: Boolean(medicalOverride),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    res.json({ message: 'Criteria saved', data: criteria })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENTS — GET (faculty's own uploads)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/documents', authMiddleware, async (req, res) => {
  try {
    const docs = await Document.find({ uploadedBy: req.user.id })
      .sort({ createdAt: -1 })
    res.json({ data: docs })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENTS — POST (upload)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/documents', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })
    const faculty = await Faculty.findById(req.user.id)

    const doc = await Document.create({
      title:        req.body.title || req.file.originalname,
      description:  req.body.description || '',
      originalName: req.file.originalname,
      filename:     req.file.filename,
      filePath:     req.file.path,
      mimeType:     req.file.mimetype,
      fileSize:     req.file.size,
      uploadedBy:   req.user.id,
      facultyName:  faculty?.name || '',
      subject:      faculty?.subject || '',
      subjectCode:  faculty?.subjectCode || '',
    })

    res.status(201).json({ message: 'Document uploaded', data: doc })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENTS — DELETE
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/documents/:id', authMiddleware, async (req, res) => {
  try {
    const doc = await Document.findOneAndDelete({
      _id:        req.params.id,
      uploadedBy: req.user.id,
    })
    if (!doc) return res.status(404).json({ message: 'Document not found' })

    // delete file from disk
    if (fs.existsSync(doc.filePath)) fs.unlinkSync(doc.filePath)

    res.json({ message: 'Document deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router