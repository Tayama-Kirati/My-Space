const User = require('../models/User')
const jwt = require('jsonwebtoken')

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  )

  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE }
  )

  return { accessToken, refreshToken }
}

exports.register = async (req, res) => {
  try {
    const { email, username, password, firstName, lastName } = req.body

    // Validation
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    })

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' })
    }

    // Create user
    const user = new User({
      email,
      username,
      password,
      firstName,
      lastName,
    })

    await user.save()

    const { accessToken, refreshToken } = generateTokens(user._id)

    res.status(201).json({
      success: true,
      user: user.toJSON(),
      token: accessToken,
      accessToken,
      refreshToken,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }

    const user = await User.findOne({ email }).select('+password')

    if (!user) {
      return res.status(401).json({ error: 'No account found with this email.' })
    }

    if (!(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Incorrect password.' })
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(403).json({ error: 'Account is locked' })
    }

    user.loginAttempts = 0
    user.lastLogin = new Date()
    await user.save()

    const { accessToken, refreshToken } = generateTokens(user._id)

    res.json({
      success: true,
      user: user.toJSON(),
      token: accessToken,
      accessToken,
      refreshToken,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getCurrentUser = async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user.toJSON(),
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}