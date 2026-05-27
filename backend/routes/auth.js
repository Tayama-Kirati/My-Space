const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const isAuthenticated = require('../middleware/isAuthenticated')

router.post('/register', authController.register)
router.post('/login', authController.login)
router.get('/me', isAuthenticated, authController.getCurrentUser)

module.exports = router