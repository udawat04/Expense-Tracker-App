import { Router } from 'express'
import Category from '../models/Category.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)

router.get('/', async (req, res) => {
  try {
    const { type } = req.query
    const filter = type ? { type } : {}
    const categories = await Category.find(filter).sort({ name: 1 })
    res.json(categories.map((c) => ({ id: String(c._id), name: c.name, type: c.type })))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, type } = req.body
    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' })
    }
    const category = await Category.create({ name: name.trim(), type })
    res.status(201).json({ id: String(category._id), name: category.name, type: category.type })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
