const express = require('express')
const router  = express.Router()
const {
  getAllStudents, getStudentByEnrollment, createStudent,
  updateStudent, deleteStudent, addProject, addCertification,
  getAttendance, updateAttendance, bulkUpdateAttendance,
  deleteAttendance, updateSemesterSubjects,
  getBatches, deleteBatch   // ← NEW
} = require('../controllers/student.controller')
const { verifyToken } = require('../middleware/auth.middleware')
const { authorize }   = require('../middleware/role.middleware')

router.get('/',    verifyToken, authorize('admin','tpo'), getAllStudents)
router.post('/',   verifyToken, authorize('admin'), createStudent)

// ── NEW: batch routes (must be before /:enrollmentNumber) ──
router.get('/batches',        verifyToken, authorize('admin','tpo'), getBatches)
router.delete('/batch/:batch',verifyToken, authorize('admin'), deleteBatch)

router.get('/:enrollmentNumber',    verifyToken, getStudentByEnrollment)
router.put('/:enrollmentNumber',    verifyToken, updateStudent)
router.delete('/:enrollmentNumber', verifyToken, authorize('admin'), deleteStudent)

router.post('/:enrollmentNumber/projects',       verifyToken, addProject)
router.post('/:enrollmentNumber/certifications', verifyToken, addCertification)
router.put('/:enrollmentNumber/semester/:sem/subjects', verifyToken, updateSemesterSubjects)

router.get('/:enrollmentNumber/attendance',             verifyToken, getAttendance)
router.post('/:enrollmentNumber/attendance',            verifyToken, authorize('admin','tpo'), updateAttendance)
router.put('/:enrollmentNumber/attendance/bulk',        verifyToken, authorize('admin','tpo'), bulkUpdateAttendance)
router.delete('/:enrollmentNumber/attendance/:subject', verifyToken, authorize('admin','tpo'), deleteAttendance)

module.exports = router