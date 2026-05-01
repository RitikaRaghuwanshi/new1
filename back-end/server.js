const dns = require('dns')
dns.setServers(['8.8.8.8', '8.8.4.4'])

const dotenv = require('dotenv')
dotenv.config()

const express  = require('express')
const mongoose = require('mongoose')
const cors     = require('cors')
const morgan   = require('morgan')
const path     = require('path')
const fs       = require('fs')

const app = express()

// ✅ PORT CHANGE (IMPORTANT FIX)
const PORT = process.env.PORT || 5000   // ← 5000 se 5000 kar diya

// Middlewares
app.use(cors({
  origin: [
    'http://localhost:5173','http://localhost:5174','http://localhost:5175',
    'http://localhost:5176','http://localhost:5177','http://localhost:5178'
  ],
  credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))

// Upload folder
const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
app.use('/uploads', express.static(uploadsDir))

// Routes
app.use('/api/auth',      require('./routes/auth.routes'))
app.use('/api/students',  require('./routes/student.routes'))
app.use('/api/tpo',       require('./routes/tpo.routes'))
app.use('/api/analytics', require('./routes/analytics.routes'))
app.use('/api/admin',     require('./routes/admin.routes'))
app.use('/api/faculty',   require('./routes/faculty.routes.js'))
app.use('/api/documents', require('./routes/document.routes')) 
app.use('/api/personal-info', require('./routes/Personalinfo.routes'))

// Test routes
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'AcadPlace API' }))
app.get('/', (_req, res) => res.json({ message: 'Academic Placement API is running' }))

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack)
  res.status(500).json({ success: false, message: err.message || 'Server Error' })
})

app.use('/api/attendance-sheet', require('./routes/attendanceSheet.routes'))

// MongoDB connect + server start
const MONGO_URI = process.env.MONGO_URI 

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected')

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`)
    })

  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message)
    process.exit(1)
  })