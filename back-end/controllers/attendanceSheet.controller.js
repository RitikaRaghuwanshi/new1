const DailyAttendance = require('../models/AttendanceSheet.model')
const Student         = require('../models/Student')
const Faculty         = require('../models/faculty')

function getFacultyId(req) {
  // JWT decoded token mein facultyId ya id ho sakta hai
  return req.user?.facultyId || req.user?.id || req.user?.enrollmentNumber || null
}

function calcEligibility(studentRecords, allDates) {
  const presentDays  = allDates.filter(d => studentRecords[d] === 'P').length
  const totalWorking = allDates.length
  if (totalWorking === 0) return { presentDays: 0, totalWorking: 0, percentage: 0 }
  return {
    presentDays,
    totalWorking,
    percentage: parseFloat(((presentDays / totalWorking) * 100).toFixed(2)),
  }
}

/* ─── GET /api/attendance-sheet/students ───────────────────── */
const getStudentList = async (req, res) => {
  try {
    const facultyId = getFacultyId(req)
    const faculty   = await Faculty.findOne({ facultyId })
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' })

    const students = await Student
      .find({ branch: 'Information Technology', isActive: true })
      .select('enrollmentNumber name division semester')
      .sort({ enrollmentNumber: 1 })

    res.json({ success: true, data: students, faculty })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/* ─── GET /api/attendance-sheet?month=YYYY-MM ──────────────── */
const getAttendanceSheet = async (req, res) => {
  try {
    const facultyId = getFacultyId(req)
    const faculty   = await Faculty.findOne({ facultyId })
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' })

    const { month } = req.query
    const filter = { facultyId, subject: faculty.subject }
    if (month) filter.date = { $regex: `^${month}` }

    const records = await DailyAttendance.find(filter).sort({ date: 1 })

    res.json({
      success: true,
      data: records,
      faculty: { subject: faculty.subject, subjectCode: faculty.subjectCode },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/* ─── POST /api/attendance-sheet ───────────────────────────── */
const saveAttendance = async (req, res) => {
  try {
    const facultyId = getFacultyId(req)

    // FIX: facultyId null check — log karo taaki debug ho sake
    if (!facultyId) {
      console.error('saveAttendance: facultyId is null. req.user =', req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized: faculty identity missing' })
    }

    const faculty = await Faculty.findOne({ facultyId })
    if (!faculty) {
      console.error('saveAttendance: faculty not found for facultyId =', facultyId)
      return res.status(404).json({ success: false, message: 'Faculty not found' })
    }

    const { date, records } = req.body
    if (!date || !Array.isArray(records) || !records.length)
      return res.status(400).json({ success: false, message: 'date and records[] are required' })

    // Filter out any records with null/empty enrollmentNumber
    const cleanRecords = records
      .filter(r => r.enrollmentNumber && r.enrollmentNumber.trim())
      .map(r => ({
        enrollmentNumber: r.enrollmentNumber.trim().toUpperCase(),
        name:             r.name || '',
        status:           ['P','A','L','H'].includes(r.status) ? r.status : 'A',
      }))

    if (!cleanRecords.length)
      return res.status(400).json({ success: false, message: 'No valid records found' })

    const totalPresent = cleanRecords.filter(r => r.status === 'P').length
    const totalAbsent  = cleanRecords.filter(r => r.status === 'A').length

    const doc = await DailyAttendance.findOneAndUpdate(
      { facultyId, subject: faculty.subject, date },
      {
        $set: {
          facultyId,
          subject:      faculty.subject,
          subjectCode:  faculty.subjectCode || '',
          date,
          records:      cleanRecords,
          totalPresent,
          totalAbsent,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    res.json({ success: true, data: doc })
  } catch (err) {
    console.error('saveAttendance error:', err)
    // E11000 = duplicate key — send clear message
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Attendance for this date already exists. It will be updated.',
      })
    }
    res.status(500).json({ success: false, message: err.message })
  }
}

/* ─── DELETE /api/attendance-sheet/:date ───────────────────── */
const deleteDate = async (req, res) => {
  try {
    const facultyId = getFacultyId(req)
    const faculty   = await Faculty.findOne({ facultyId })
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' })

    await DailyAttendance.deleteOne({ facultyId, subject: faculty.subject, date: req.params.date })
    res.json({ success: true, message: 'Date deleted' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/* ─── GET /api/attendance-sheet/summary ────────────────────── */
const getSummary = async (req, res) => {
  try {
    const facultyId = getFacultyId(req)
    const faculty   = await Faculty.findOne({ facultyId })
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' })

    const { month } = req.query
    const filter = { facultyId, subject: faculty.subject }
    if (month) filter.date = { $regex: `^${month}` }

    const allDocs = await DailyAttendance.find(filter).sort({ date: 1 })

    const workingDays = []
    for (const doc of allDocs) {
      const hasPorA = doc.records.some(r => r.status === 'P' || r.status === 'A')
      if (hasPorA) workingDays.push(doc.date)
    }

    const studentMap = {}
    const studentNames = {}
    for (const doc of allDocs) {
      for (const r of doc.records) {
        if (!studentMap[r.enrollmentNumber]) {
          studentMap[r.enrollmentNumber] = {}
          studentNames[r.enrollmentNumber] = r.name
        }
        studentMap[r.enrollmentNumber][doc.date] = r.status
      }
    }

    const summary = Object.keys(studentMap).sort().map(enrollment => {
      const elig = calcEligibility(studentMap[enrollment], workingDays)
      return {
        enrollmentNumber: enrollment,
        name:             studentNames[enrollment] || '',
        ...elig,
        isEligible: elig.percentage >= 75,
        perDate:    studentMap[enrollment],
      }
    })

    res.json({
      success: true,
      data: summary,
      workingDays,
      totalWorkingDays: workingDays.length,
      faculty: { subject: faculty.subject, subjectCode: faculty.subjectCode },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { getStudentList, getAttendanceSheet, saveAttendance, deleteDate, getSummary }