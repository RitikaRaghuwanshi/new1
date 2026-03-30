const multer = require('multer')
const path   = require('path')
const fs     = require('fs')

const docsDir = path.join(__dirname, '../uploads/docs')
if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, docsDir),
  filename:    (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `${unique}${path.extname(file.originalname)}`)
  },
})

// Allow ANY file type — no filter
module.exports = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
})