const express = require('express')
const router = express.Router()
const { suggest } = require('../controllers/aiController')
const isAuthenticated = require('../middleware/isAuthenticated')

router.post('/suggest', isAuthenticated, suggest)

module.exports = router
