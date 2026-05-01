const PersonalInfo = require('../models/PersonalInfo')
const Student      = require('../models/Student')

// GET /api/personal-info/:enrollment  — student gets own, admin gets any
const getPersonalInfo = async (req, res) => {
  try {
    const enrollment = req.params.enrollment.toUpperCase()

    // Students can only view their own
    if (req.user.role === 'student' && req.user.enrollmentNumber !== enrollment) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }

    let info = await PersonalInfo.findOne({ enrollmentNumber: enrollment })
    if (!info) {
      // Return empty scaffold so frontend can pre-fill
      const student = await Student.findOne({ enrollmentNumber: enrollment })
      return res.json({
        success: true,
        data: {
          enrollmentNumber: enrollment,
          fullName:         student?.name || '',
          mobileNumber:     student?.phone || '',
          personalEmail:    student?.email || '',
        },
        isNew: true,
      })
    }

    res.json({ success: true, data: info, isNew: false })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// PUT /api/personal-info/:enrollment  — student updates own
const updatePersonalInfo = async (req, res) => {
  try {
    const enrollment = req.params.enrollment.toUpperCase()

    if (req.user.role === 'student' && req.user.enrollmentNumber !== enrollment) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }

    // Strip admin-only fields if student is updating
    const payload = { ...req.body, enrollmentNumber: enrollment }
    if (req.user.role === 'student') {
      payload.lastUpdatedByStudent = new Date()
      delete payload.lastUpdatedByAdmin
    } else {
      payload.lastUpdatedByAdmin = new Date()
    }

    const info = await PersonalInfo.findOneAndUpdate(
      { enrollmentNumber: enrollment },
      { $set: payload },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    )

    res.json({ success: true, data: info })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// GET /api/personal-info/:enrollment/download  — admin only, returns JSON for PDF
const downloadPersonalInfo = async (req, res) => {
  try {
    if (!['admin', 'tpo'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Admin/TPO only' })
    }

    const enrollment = req.params.enrollment.toUpperCase()
    const [info, student] = await Promise.all([
      PersonalInfo.findOne({ enrollmentNumber: enrollment }),
      Student.findOne({ enrollmentNumber: enrollment })
    ])

    if (!student) return res.status(404).json({ success: false, message: 'Student not found' })

    // Build a complete merged record
    const record = {
      ...(info ? info.toObject() : {}),
      enrollmentNumber: enrollment,
      studentName:      student.name,
      branch:           student.branch,
      division:         student.division,
      batch:            student.batch,
      semester:         student.semester,
      cgpa:             student.cgpa,
      placementStatus:  student.placementStatus,
    }

    // Set header to trigger download as JSON — client handles rendering
    res.setHeader('Content-Disposition', `attachment; filename="${enrollment}_personal_info.json"`)
    res.setHeader('Content-Type', 'application/json')
    res.json(record)
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// GET /api/personal-info  — admin list view (search by enrollment)
const listPersonalInfo = async (req, res) => {
  try {
    if (!['admin', 'tpo'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }
    const { enrollment } = req.query
    const filter = enrollment ? { enrollmentNumber: new RegExp(enrollment, 'i') } : {}
    const records = await PersonalInfo.find(filter).sort({ enrollmentNumber: 1 }).limit(50)
    res.json({ success: true, data: records })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

module.exports = { getPersonalInfo, updatePersonalInfo, downloadPersonalInfo, listPersonalInfo }