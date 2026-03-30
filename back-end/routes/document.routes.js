const express  = require('express')
const router   = express.Router()
const fs       = require('fs')
const Document = require('../models/Document')
const { getAllDocuments } = require('../controllers/document.controller')
const { verifyToken }    = require('../middleware/auth.middleware')

// List all docs
router.get('/', verifyToken, getAllDocuments)

// Download a specific doc
router.get('/download/:id', verifyToken, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id)
    if (!doc || !doc.isActive)
      return res.status(404).json({ message: 'Document not found' })
    if (!fs.existsSync(doc.filePath))
      return res.status(404).json({ message: 'File not found on server' })
    res.download(doc.filePath, doc.originalName)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router