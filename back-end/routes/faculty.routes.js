const express  = require('express')
const router   = express.Router()

const {
  getFacultyProfile, getStudents, getAttendance,
  markAttendance, getMarks, uploadMarks, manualMarks,
} = require('../controllers/faculty.controller')
const { getSyllabus, saveSyllabus, upsertUnit, deleteUnit, upsertMST } =
  require('../controllers/syllabus.controller')
const { uploadDocument, getFacultyDocuments, deleteDocument } =
  require('../controllers/document.controller')

const { verifyToken }  = require('../middleware/auth.middleware')
const upload           = require('../middleware/upload.middleware')
const docUpload        = require('../middleware/docUpload.middleware')

router.use(verifyToken)

// Existing routes
router.get('/profile',       getFacultyProfile)
router.get('/students',      getStudents)
router.get('/attendance',    getAttendance)
router.get('/marks',         getMarks)
router.post('/attendance',   markAttendance)
router.post('/upload-marks', upload.single('file'), uploadMarks)
router.post('/manual-marks', manualMarks)

// Syllabus
router.get('/syllabus',                     getSyllabus)
router.post('/syllabus',                    saveSyllabus)
router.patch('/syllabus/unit',              upsertUnit)
router.delete('/syllabus/unit/:unitNumber', deleteUnit)
router.patch('/syllabus/mst',               upsertMST)

// Documents (notices)
router.get('/documents',        getFacultyDocuments)
router.post('/documents',       docUpload.single('file'), uploadDocument)
router.delete('/documents/:id', deleteDocument)

module.exports = router