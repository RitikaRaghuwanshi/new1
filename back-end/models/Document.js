const mongoose = require('mongoose')

const documentSchema = new mongoose.Schema({
  title:        { type: String, required: true, trim: true },
  description:  { type: String, trim: true, default: '' },
  fileName:     { type: String, required: true },
  originalName: { type: String, required: true },
  fileSize:     { type: Number },
  mimeType:     { type: String, default: '' },
  filePath:     { type: String, required: true },
  uploadedBy:   { type: String, required: true },  // facultyId
  facultyName:  { type: String, default: '' },
  subject:      { type: String, default: '' },
  subjectCode:  { type: String, default: '' },
  isActive:     { type: Boolean, default: true },
}, { timestamps: true })

documentSchema.index({ createdAt: -1 })

module.exports = mongoose.model('Document', documentSchema)