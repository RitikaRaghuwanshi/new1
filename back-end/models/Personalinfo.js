const mongoose = require('mongoose')

const addressSchema = new mongoose.Schema({
  line1:   { type: String, trim: true, default: '' },
  line2:   { type: String, trim: true, default: '' },
  city:    { type: String, trim: true, default: '' },
  state:   { type: String, trim: true, default: '' },
  pincode: { type: String, trim: true, default: '' },
  country: { type: String, trim: true, default: 'India' },
}, { _id: false })

const personalInfoSchema = new mongoose.Schema({
  enrollmentNumber: { type: String, required: true, unique: true, uppercase: true, trim: true, ref: 'Student' },

  // Basic
  fullName:          { type: String, trim: true, default: '' },
  dateOfBirth:       { type: String, default: '' },     // YYYY-MM-DD
  gender:            { type: String, enum: ['Male','Female','Other','Prefer not to say'], default: '' },
  bloodGroup:        { type: String, trim: true, default: '' },
  nationality:       { type: String, trim: true, default: 'Indian' },
  religion:          { type: String, trim: true, default: '' },
  category:          { type: String, enum: ['General','OBC','SC','ST','EWS','Other',''], default: '' },
  aadharNumber:      { type: String, trim: true, default: '' },

  // Contact
  personalEmail:     { type: String, trim: true, lowercase: true, default: '' },
  mobileNumber:      { type: String, trim: true, default: '' },
  alternateMobile:   { type: String, trim: true, default: '' },

  // Parents / Guardian
  fatherName:        { type: String, trim: true, default: '' },
  fatherOccupation:  { type: String, trim: true, default: '' },
  fatherMobile:      { type: String, trim: true, default: '' },
  motherName:        { type: String, trim: true, default: '' },
  motherOccupation:  { type: String, trim: true, default: '' },
  motherMobile:      { type: String, trim: true, default: '' },
  guardianName:      { type: String, trim: true, default: '' },
  guardianRelation:  { type: String, trim: true, default: '' },
  guardianMobile:    { type: String, trim: true, default: '' },
  annualFamilyIncome:{ type: String, trim: true, default: '' },

  // Addresses
  permanentAddress:  { type: addressSchema, default: () => ({}) },
  temporaryAddress:  { type: addressSchema, default: () => ({}) },
  sameAsPermanent:   { type: Boolean, default: false },

  // Academic extras
  admissionYear:     { type: String, default: '' },
  rollNumber:        { type: String, trim: true, default: '' },
  hostelResident:    { type: Boolean, default: false },
  hostelBlock:       { type: String, trim: true, default: '' },
  busRoute:          { type: String, trim: true, default: '' },

  // Emergency
  emergencyContactName:   { type: String, trim: true, default: '' },
  emergencyContactPhone:  { type: String, trim: true, default: '' },
  emergencyContactRelation:{ type: String, trim: true, default: '' },

  lastUpdatedByStudent: { type: Date },
  lastUpdatedByAdmin:   { type: Date },
}, { timestamps: true })

module.exports = mongoose.model('PersonalInfo', personalInfoSchema)