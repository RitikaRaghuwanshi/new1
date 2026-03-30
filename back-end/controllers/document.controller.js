const Document = require('../models/Document')
const Faculty  = require('../models/faculty')
const fs       = require('fs')

const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

function getFacultyId(req) {
  return req.user?.facultyId || req.user?.enrollmentNumber || null
}

// POST /api/faculty/documents
const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file)
    return res.status(400).json({ success: false, message: 'No file uploaded' })

  const facultyId = getFacultyId(req)
  const faculty   = await Faculty.findOne({ facultyId })
  if (!faculty)
    return res.status(404).json({ success: false, message: 'Faculty not found' })

  const { title, description } = req.body
  if (!title?.trim())
    return res.status(400).json({ success: false, message: 'Title is required' })

  const doc = await Document.create({
    title:        title.trim(),
    description:  description?.trim() || '',
    fileName:     req.file.filename,
    originalName: req.file.originalname,
    fileSize:     req.file.size,
    mimeType:     req.file.mimetype,
    filePath:     req.file.path,
    uploadedBy:   facultyId,
    facultyName:  faculty.name,
    subject:      faculty.subject,
    subjectCode:  faculty.subjectCode,
  })

  res.status(201).json({ success: true, data: doc })
})

// GET /api/faculty/documents  — faculty's own docs
const getFacultyDocuments = asyncHandler(async (req, res) => {
  const facultyId = getFacultyId(req)
  const docs = await Document.find({ uploadedBy: facultyId, isActive: true })
    .sort({ createdAt: -1 })
  res.json({ success: true, data: docs })
})

// GET /api/documents  — all active docs (for students)
const getAllDocuments = asyncHandler(async (_req, res) => {
  const docs = await Document.find({ isActive: true })
    .sort({ createdAt: -1 })
    .select('-filePath')
  res.json({ success: true, data: docs })
})

// DELETE /api/faculty/documents/:id
const deleteDocument = asyncHandler(async (req, res) => {
  const facultyId = getFacultyId(req)
  const doc = await Document.findById(req.params.id)

  if (!doc)
    return res.status(404).json({ success: false, message: 'Document not found' })
  if (doc.uploadedBy !== facultyId)
    return res.status(403).json({ success: false, message: 'Not authorized' })

  if (doc.filePath && fs.existsSync(doc.filePath)) fs.unlinkSync(doc.filePath)
  await doc.deleteOne()
  res.json({ success: true, message: 'Document deleted' })
})

module.exports = { uploadDocument, getFacultyDocuments, getAllDocuments, deleteDocument }