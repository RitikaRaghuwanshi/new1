const mongoose = require('mongoose')

const attendanceCriteriaSchema = new mongoose.Schema(
  {
    facultyId:       { type: String, required: true },
    subjectCode:     { type: String, required: true },
    minPercentage:   { type: Number, default: 75, min: 1, max: 100 },
    countLeave:      { type: Boolean, default: false },
    countHoliday:    { type: Boolean, default: false },
    medicalOverride: { type: Boolean, default: true },
  },
  { timestamps: true }
)

attendanceCriteriaSchema.index({ facultyId: 1, subjectCode: 1 }, { unique: true })

module.exports = mongoose.model('AttendanceCriteria', attendanceCriteriaSchema)