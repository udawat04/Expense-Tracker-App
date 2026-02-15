import { Router } from 'express'
import Budget from '../models/Budget.js'
import Transaction from '../models/Transaction.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)

// Get budgets for a month (with current spending)
router.get('/', async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear()
    const month = parseInt(req.query.month, 10) || new Date().getMonth() + 1

    const budgets = await Budget.find({
      userId: req.user._id,
      year,
      month,
    }).lean()

    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 0, 23, 59, 59)

    const expenses = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          type: 'expense',
          date: { $gte: start, $lte: end },
        },
      },
      { $group: { _id: '$categoryId', spent: { $sum: '$amount' }, categoryName: { $first: '$categoryName' } } },
    ])

    const spentByCategory = Object.fromEntries(expenses.map((e) => [String(e._id), e.spent]))

    const list = budgets.map((b) => ({
      id: String(b._id),
      categoryId: String(b.categoryId),
      categoryName: b.categoryName,
      amount: b.amount,
      spent: spentByCategory[String(b.categoryId)] || 0,
      remaining: Math.max(0, b.amount - (spentByCategory[String(b.categoryId)] || 0)),
      percentUsed: Math.min(100, ((spentByCategory[String(b.categoryId)] || 0) / b.amount) * 100),
    }))

    res.json(list)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Create or update budget
router.post('/', async (req, res) => {
  try {
    const { categoryId, categoryName, amount, year, month } = req.body
    const y = year ?? new Date().getFullYear()
    const m = month ?? new Date().getMonth() + 1

    if (!categoryId || !categoryName || !amount || amount <= 0) {
      return res.status(400).json({ error: 'categoryId, categoryName, and positive amount are required' })
    }

    const budget = await Budget.findOneAndUpdate(
      { userId: req.user._id, categoryId, year: y, month: m },
      { categoryName, amount: Number(amount), year: y, month: m },
      { new: true, upsert: true }
    )

    res.json({
      id: String(budget._id),
      categoryId: String(budget.categoryId),
      categoryName: budget.categoryName,
      amount: budget.amount,
      year: budget.year,
      month: budget.month,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Delete budget
router.delete('/:id', async (req, res) => {
  try {
    const result = await Budget.deleteOne({ _id: req.params.id, userId: req.user._id })
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Budget not found' })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get budget alerts for current month (categories exceeding or approaching limit)
router.get('/alerts', async (req, res) => {
  try {
    const year = new Date().getFullYear()
    const month = new Date().getMonth() + 1
    const budgets = await Budget.find({ userId: req.user._id, year, month }).lean()

    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 0, 23, 59, 59)
    const expenses = await Transaction.aggregate([
      { $match: { userId: req.user._id, type: 'expense', date: { $gte: start, $lte: end } } },
      { $group: { _id: '$categoryId', spent: { $sum: '$amount' }, categoryName: { $first: '$categoryName' } } },
    ])
    const spentByCategory = Object.fromEntries(expenses.map((e) => [String(e._id), e.spent]))

    const alerts = []
    for (const b of budgets) {
      const spent = spentByCategory[String(b.categoryId)] || 0
      const pct = (spent / b.amount) * 100
      if (pct >= 100) {
        alerts.push({ type: 'exceeded', categoryName: b.categoryName, budget: b.amount, spent, percentUsed: pct })
      } else if (pct >= 80) {
        alerts.push({ type: 'warning', categoryName: b.categoryName, budget: b.amount, spent, percentUsed: pct })
      }
    }
    res.json(alerts)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
