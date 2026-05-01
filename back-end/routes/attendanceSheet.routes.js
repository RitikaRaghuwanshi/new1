const express = require('express')
const router  = express.Router()
const {
  getStudentList,
  getAttendanceSheet,
  saveAttendance,
  deleteDate,
  getSummary,
} = require('../controllers/attendanceSheet.controller')
const { verifyToken } = require('../middleware/auth.middleware')

router.use(verifyToken)

router.get('/students', getStudentList)
router.get('/summary',  getSummary)
router.get('/',         getAttendanceSheet)
router.post('/',        saveAttendance)
router.delete('/:date', deleteDate)

module.exports = router