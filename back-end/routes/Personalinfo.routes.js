const express = require('express')
const router  = express.Router()
const {
  getPersonalInfo,
  updatePersonalInfo,
  downloadPersonalInfo,
  listPersonalInfo,
} = require('../controllers/Personalinfo.controller')
const { verifyToken } = require('../middleware/auth.middleware')

// All routes require auth
router.use(verifyToken)

// Admin: list all / search
router.get('/', listPersonalInfo)

// Student + Admin: get by enrollment
router.get('/:enrollment', getPersonalInfo)

// Student + Admin: update
router.put('/:enrollment', updatePersonalInfo)

// Admin: download JSON record
router.get('/:enrollment/download', downloadPersonalInfo)

module.exports = router