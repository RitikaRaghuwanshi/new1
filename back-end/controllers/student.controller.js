const Student = require('../models/Student')

const getAllStudents = async (req, res) => {
  try {
    const { cgpa, skill, status, division, search, batch, page = 1, limit = 20 } = req.query
    const filter = { isActive: true }
    if (cgpa)     filter.cgpa = { $gte: parseFloat(cgpa) }
    if (status)   filter.placementStatus = status
    if (division) filter.division = division
    if (batch)    filter.batch = batch
    if (skill)    filter.technicalSkills = { $in: [new RegExp(skill, 'i')] }
    if (search)   filter.$or = [
      { name: new RegExp(search, 'i') },
      { enrollmentNumber: new RegExp(search, 'i') }
    ]
    const total    = await Student.countDocuments(filter)
    const students = await Student.find(filter)
      .select('-semesterResults -certifications -projects -internships')
      .sort({ cgpa: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
    res.json({ success: true, total, page: parseInt(page), data: students })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const getStudentByEnrollment = async (req, res) => {
  try {
    const student = await Student.findOne({ enrollmentNumber: req.params.enrollmentNumber.toUpperCase() })
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' })
    if (req.user.role === 'student' && req.user.enrollmentNumber !== student.enrollmentNumber)
      return res.status(403).json({ success: false, message: 'Access denied' })
    res.json({ success: true, data: student })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const createStudent = async (req, res) => {
  try {
    const exists = await Student.findOne({ enrollmentNumber: req.body.enrollmentNumber?.toUpperCase() })
    if (exists) return res.status(400).json({ success: false, message: 'Enrollment number already exists' })
    const student = await Student.create(req.body)
    res.status(201).json({ success: true, data: student })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const updateStudent = async (req, res) => {
  try {
    const enrollmentNumber = req.params.enrollmentNumber.toUpperCase()
    if (req.user.role === 'student') {
      if (req.user.enrollmentNumber !== enrollmentNumber)
        return res.status(403).json({ success: false, message: 'Access denied' })
      const allowedFields = [
        'phone','email','passportPhotoUrl','dateOfBirth','gender','bloodGroup',
        'aadharNumber','address','parentInfo','technicalSkills','softSkills',
        'programmingLanguages','projects','certifications','internships',
        'achievements','linkedinUrl','githubUrl','extraCurricular','semesterResults','personalInfo',
      ]
      Object.keys(req.body).forEach(key => { if (!allowedFields.includes(key)) delete req.body[key] })
    }
    const student = await Student.findOneAndUpdate(
      { enrollmentNumber }, { $set: req.body }, { new: true, runValidators: true }
    )
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' })
    res.json({ success: true, data: student })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate(
      { enrollmentNumber: req.params.enrollmentNumber.toUpperCase() },
      { isActive: false }, { new: true }
    )
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' })
    res.json({ success: true, message: 'Student deactivated successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const addProject = async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate(
      { enrollmentNumber: req.params.enrollmentNumber.toUpperCase() },
      { $push: { projects: req.body } }, { new: true }
    )
    res.json({ success: true, data: student.projects })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const deleteProject = async (req, res) => {
  try {
    const enrollmentNumber = req.params.enrollmentNumber.toUpperCase()
    const index = parseInt(req.params.index)
    const student = await Student.findOne({ enrollmentNumber })
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' })
    student.projects.splice(index, 1)
    await student.save()
    res.json({ success: true, data: student.projects })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const addCertification = async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate(
      { enrollmentNumber: req.params.enrollmentNumber.toUpperCase() },
      { $push: { certifications: req.body } }, { new: true }
    )
    res.json({ success: true, data: student.certifications })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const deleteCertification = async (req, res) => {
  try {
    const enrollmentNumber = req.params.enrollmentNumber.toUpperCase()
    const index = parseInt(req.params.index)
    const student = await Student.findOne({ enrollmentNumber })
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' })
    student.certifications.splice(index, 1)
    await student.save()
    res.json({ success: true, data: student.certifications })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const getAttendance = async (req, res) => {
  try {
    const student = await Student.findOne({ enrollmentNumber: req.params.enrollmentNumber.toUpperCase() })
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' })
    res.json({ success: true, data: student.attendance || [] })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const updateAttendance = async (req, res) => {
  try {
    const enrollmentNumber = req.params.enrollmentNumber.toUpperCase()
    const { subject, totalClasses, attendedClasses, semester } = req.body
    const student = await Student.findOne({ enrollmentNumber })
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' })
    if (!student.attendance) student.attendance = []
    const existingIndex = student.attendance.findIndex(a => a.subject === subject && a.semester === semester)
    if (existingIndex > -1) {
      student.attendance[existingIndex].totalClasses    = totalClasses
      student.attendance[existingIndex].attendedClasses = attendedClasses
    } else {
      student.attendance.push({ subject, totalClasses, attendedClasses, semester })
    }
    await student.save()
    res.json({ success: true, data: student.attendance })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const bulkUpdateAttendance = async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate(
      { enrollmentNumber: req.params.enrollmentNumber.toUpperCase() },
      { $set: { attendance: req.body.attendance } }, { new: true }
    )
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' })
    res.json({ success: true, data: student.attendance })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const deleteAttendance = async (req, res) => {
  try {
    const student = await Student.findOne({ enrollmentNumber: req.params.enrollmentNumber.toUpperCase() })
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' })
    student.attendance = student.attendance.filter(a => a.subject !== req.params.subject)
    await student.save()
    res.json({ success: true, data: student.attendance })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const updateSemesterSubjects = async (req, res) => {
  try {
    const enrollmentNumber = req.params.enrollmentNumber.toUpperCase()
    const semNumber = parseInt(req.params.sem)
    const { subjects } = req.body
    const student = await Student.findOne({ enrollmentNumber })
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' })
    const semIndex = student.semesterResults.findIndex(s => s.semester === semNumber)
    if (semIndex > -1) student.semesterResults[semIndex].subjects = subjects
    else student.semesterResults.push({ semester: semNumber, subjects, sgpa: 0, backlogs: 0 })
    await student.save()
    res.json({ success: true, data: student.semesterResults })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// ── NEW: Batch management ──────────────────────────────────────────────────────
const getBatches = async (req, res) => {
  try {
    const batches = await Student.distinct('batch', { isActive: true })
    res.json({ success: true, data: batches.filter(Boolean).sort() })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const deleteBatch = async (req, res) => {
  try {
    const batch = req.params.batch
    if (!batch) return res.status(400).json({ success: false, message: 'Batch required' })
    const result = await Student.deleteMany({ batch })
    res.json({ success: true, message: `Deleted ${result.deletedCount} students from batch ${batch}` })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

module.exports = {
  getAllStudents, getStudentByEnrollment, createStudent, updateStudent,
  deleteStudent, addProject, deleteProject, addCertification, deleteCertification,
  getAttendance, updateAttendance, bulkUpdateAttendance, deleteAttendance,
  updateSemesterSubjects, getBatches, deleteBatch,
}