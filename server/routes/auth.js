import { Router } from 'express'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import User from '../models/User.js'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }
    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' })
    }
    const user = await User.create({
      email: email.toLowerCase(),
      password,
      name: name || email.split('@')[0],
    })
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' })
    res.status(201).json({
      user: { id: user._id, email: user.email, name: user.name },
      token,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }
    const valid = await user.comparePassword(password)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' })
    res.json({
      user: { id: user._id, email: user.email, name: user.name },
      token,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'Email is required' })
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return res.json({ message: 'If that email exists, a reset link has been sent' })
    }
    const token = crypto.randomBytes(32).toString('hex')
    user.resetToken = token
    user.resetTokenExpiry = Date.now() + 3600000
    await user.save({ validateBeforeSave: false })
    res.json({ message: 'If that email exists, a reset link has been sent', resetToken: token })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body
    if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password are required' })
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    })
    if (!user) return res.status(400).json({ error: 'Invalid or expired reset token' })
    user.password = newPassword
    user.resetToken = null
    user.resetTokenExpiry = null
    await user.save()
    res.json({ message: 'Password reset successful' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
