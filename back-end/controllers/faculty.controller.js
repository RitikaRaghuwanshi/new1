const Faculty    = require('../models/faculty')
const Student    = require('../models/Student')
const Attendance = require('../models/Attendance')
const Marks      = require('../models/Marks')
const User       = require('../models/User')
const xlsx       = require('xlsx')
const fs         = require('fs')

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

function getFacultyId(req) {
  return req.user?.facultyId || req.user?.enrollmentNumber || null
}

const getFacultyProfile = asyncHandler(async (req, res) => {
  const facultyId = getFacultyId(req)
  const faculty = await Faculty.findOne({ facultyId })
  if (!faculty) return res.status(404).json({ success: false, message: 'Faculty profile not found' })
  res.json({ success: true, data: faculty })
})

const getAllFaculty = asyncHandler(async (req, res) => {
  const faculties = await Faculty.find().sort({ createdAt: -1 })
  res.json({ success: true, data: faculties })
})

const getStudents = asyncHandler(async (req, res) => {
  const { search, enrollmentNumber, name } = req.query
  const query = { branch: 'IT', semester: { $in: [7, 8] } }
  if (enrollmentNumber) query.enrollmentNumber = { $regex: enrollmentNumber, $options: 'i' }
  if (name)             query.name             = { $regex: name,             $options: 'i' }
  if (search) {
    query.$or = [
      { enrollmentNumber: { $regex: search, $options: 'i' } },
      { name:             { $regex: search, $options: 'i' } },
    ]
  }
  const students = await Student.find(query).select('-__v').sort({ enrollmentNumber: 1 })
  res.json({ success: true, count: students.length, data: students })
})

// ─── GET /api/faculty/attendance ──────────────────────────────────────────────
// FIX: Added month filter support. Frontend sends ?month=YYYY-MM
// Response is now grouped by date so frontend can build the map correctly.
const getAttendance = asyncHandler(async (req, res) => {
  const facultyId = getFacultyId(req)
  const faculty   = await Faculty.findOne({ facultyId })
  if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' })

  const { month, date, enrollmentNumber } = req.query

  const query = { subject: faculty.subject }
  if (date)             query.date             = date
  if (enrollmentNumber) query.enrollmentNumber = enrollmentNumber

  // FIX: month filter — match dates starting with "YYYY-MM"
  if (month) {
    query.date = { $regex: `^${month}` }
  }

  // Fetch all flat attendance records for this subject+month
  const flatRecords = await Attendance.find(query).sort({ date: 1 }).limit(5000)

  // Group by date → [{ date, records: [{enrollmentNumber, name, status}] }]
  const byDate = {}
  for (const rec of flatRecords) {
    if (!byDate[rec.date]) byDate[rec.date] = []
    byDate[rec.date].push({
      enrollmentNumber: rec.enrollmentNumber,
      name:             rec.name || '',
      status:           rec.status,
    })
  }

  const grouped = Object.entries(byDate).map(([date, records]) => ({ date, records }))

  res.json({ success: true, count: grouped.length, data: grouped })
})

// ─── POST /api/faculty/attendance ─────────────────────────────────────────────
// FIX: Frontend sends { date: "YYYY-MM-DD", records: [{enrollmentNumber, name, status}] }
// Old code expected records[i].date — now we use the top-level date field.
const markAttendance = asyncHandler(async (req, res) => {
  const { date, records } = req.body

  if (!date)
    return res.status(400).json({ success: false, message: 'date is required' })
  if (!Array.isArray(records) || !records.length)
    return res.status(400).json({ success: false, message: 'records array is required' })

  const facultyId = getFacultyId(req)
  const faculty   = await Faculty.findOne({ facultyId })
  if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' })

  const results = { saved: [], notFound: [], errors: [] }

  // Use Promise.all for speed
  await Promise.all(records.map(async (rec) => {
    try {
      await Attendance.findOneAndUpdate(
        { enrollmentNumber: rec.enrollmentNumber, subject: faculty.subject, date },
        {
          status:    rec.status,
          name:      rec.name || '',
          facultyId: faculty.facultyId,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
      results.saved.push(rec.enrollmentNumber)
    } catch (err) {
      if (err.code === 11000) {
        // Duplicate key — try plain update
        try {
          await Attendance.updateOne(
            { enrollmentNumber: rec.enrollmentNumber, subject: faculty.subject, date },
            { $set: { status: rec.status, name: rec.name || '', facultyId: faculty.facultyId } }
          )
          results.saved.push(rec.enrollmentNumber)
        } catch (e2) {
          results.errors.push({ enrollmentNumber: rec.enrollmentNumber, error: e2.message })
        }
      } else {
        results.errors.push({ enrollmentNumber: rec.enrollmentNumber, error: err.message })
      }
    }
  }))

  res.status(201).json({ success: true, data: results })
})

const getMarks = asyncHandler(async (req, res) => {
  const facultyId = getFacultyId(req)
  const faculty   = await Faculty.findOne({ facultyId })
  if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' })
  const { enrollmentNumber } = req.query
  const query = { subject: faculty.subject }
  if (enrollmentNumber) query.enrollmentNumber = enrollmentNumber
  const marks = await Marks.find(query).sort({ enrollmentNumber: 1 })
  res.json({ success: true, count: marks.length, data: marks })
})

const uploadMarks = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })
  const facultyId = getFacultyId(req)
  const faculty   = await Faculty.findOne({ facultyId })
  if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' })
  const workbook = xlsx.readFile(req.file.path)
  const sheet    = workbook.Sheets[workbook.SheetNames[0]]
  const rows     = xlsx.utils.sheet_to_json(sheet)
  fs.unlink(req.file.path, () => {})
  if (!rows.length) return res.status(400).json({ success: false, message: 'Excel file is empty' })
  const first = rows[0]
  if (!('EnrollmentNumber' in first) || !('TheoryMarks' in first) || !('PracticalMarks' in first))
    return res.status(400).json({ success: false, message: 'Excel must have columns: EnrollmentNumber, TheoryMarks, PracticalMarks' })
  const results = { saved: [], notFound: [], errors: [] }
  for (const row of rows) {
    const enroll  = String(row.EnrollmentNumber).trim()
    const student = await Student.findOne({ enrollmentNumber: enroll })
    if (!student) { results.notFound.push(enroll); continue }
    try {
      await Marks.findOneAndUpdate(
        { enrollmentNumber: enroll, subject: faculty.subject },
        { theoryMarks: row.TheoryMarks, practicalMarks: row.PracticalMarks, facultyId: faculty.facultyId, uploadedVia: 'excel' },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
      results.saved.push(enroll)
    } catch (err) {
      results.errors.push({ enrollmentNumber: enroll, error: err.message })
    }
  }
  res.status(201).json({ success: true, data: results })
})

const manualMarks = asyncHandler(async (req, res) => {
  const { enrollmentNumber, theoryMarks, practicalMarks } = req.body
  if (!enrollmentNumber)
    return res.status(400).json({ success: false, message: 'enrollmentNumber is required' })
  const facultyId = getFacultyId(req)
  const faculty   = await Faculty.findOne({ facultyId })
  if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' })
  const student = await Student.findOne({ enrollmentNumber })
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' })
  const marks = await Marks.findOneAndUpdate(
    { enrollmentNumber, subject: faculty.subject },
    { theoryMarks, practicalMarks, facultyId: faculty.facultyId, uploadedVia: 'manual' },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )
  res.status(201).json({ success: true, data: marks })
})

const createFaculty = asyncHandler(async (req, res) => {
  const { facultyId, name, email, phone, subject, subjectCode, password } = req.body
  const exists = await Faculty.findOne({ $or: [{ facultyId }, { email }] })
  if (exists) return res.status(400).json({ success: false, message: 'Faculty ID or Email already exists' })
  const faculty = await Faculty.create({ facultyId, name, email, phone, subject, subjectCode, password: password || 'faculty123' })
  await User.create({ name, email, password: password || 'faculty123', role: 'faculty', enrollmentNumber: facultyId })
  res.status(201).json({ success: true, data: faculty })
})

const deleteFaculty = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findById(req.params.id)
  if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' })
  await User.findOneAndDelete({ enrollmentNumber: faculty.facultyId })
  await faculty.deleteOne()
  res.json({ success: true, message: 'Faculty deleted' })
})

module.exports = {
  getFacultyProfile, getAllFaculty, getStudents,
  getAttendance, markAttendance,
  getMarks, uploadMarks, manualMarks,
  createFaculty, deleteFaculty,
}