const mongoose = require('mongoose')

const dailyAttendanceSchema = new mongoose.Schema({
  facultyId:   { type: String, required: true },
  subject:     { type: String, required: true },
  subjectCode: { type: String },
  date:        { type: String, required: true }, // "YYYY-MM-DD"
  records: [{
    enrollmentNumber: { type: String, required: true },
    name:             { type: String },
    status:           { type: String, enum: ['P', 'A', 'L', 'H'], default: 'A' }, // H = Holiday
    _id: false,
  }],
  totalPresent: { type: Number, default: 0 },
  totalAbsent:  { type: Number, default: 0 },
}, { timestamps: true })

dailyAttendanceSchema.index({ facultyId: 1, date: 1 }, { unique: true })
dailyAttendanceSchema.index({ facultyId: 1 })

module.exports = mongoose.model('DailyAttendance', dailyAttendanceSchema)