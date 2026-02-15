import { Router } from 'express'
import Category from '../models/Category.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

const DEFAULTS = [
  { name: 'Grocery', type: 'expense' },
  { name: 'Transport', type: 'expense' },
  { name: 'Food & Dining', type: 'expense' },
  { name: 'Shopping', type: 'expense' },
  { name: 'Utilities', type: 'expense' },
  { name: 'Healthcare', type: 'expense' },
  { name: 'Entertainment', type: 'expense' },
  { name: 'Rent', type: 'expense' },
  { name: 'Other', type: 'expense' },
  { name: 'Salary', type: 'income' },
  { name: 'Freelance', type: 'income' },
  { name: 'Shop Sales', type: 'income' },
  { name: 'Investment', type: 'income' },
  { name: 'Gift', type: 'income' },
  { name: 'Other', type: 'income' },
]

router.post('/', authMiddleware, async (req, res) => {
  try {
    const existing = await Category.find({})
    const existingNames = new Set(existing.map((c) => c.name.toLowerCase()))
    let added = 0
    for (const { name, type } of DEFAULTS) {
      if (existingNames.has(name.toLowerCase())) continue
      await Category.create({ name, type })
      existingNames.add(name.toLowerCase())
      added++
    }
    res.json({ added })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
