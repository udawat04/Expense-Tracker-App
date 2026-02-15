import { Router } from 'express'
import Transaction from '../models/Transaction.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)

router.get('/', async (req, res) => {
  try {
    const { type, categoryId, startDate, endDate, limit } = req.query
    const filter = { userId: req.user._id }
    if (type) filter.type = type
    if (categoryId) filter.categoryId = categoryId
    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) }
    } else if (startDate) {
      filter.date = { $gte: new Date(startDate) }
    } else if (endDate) {
      filter.date = { $lte: new Date(endDate) }
    }

    let q = Transaction.find(filter).sort({ date: -1 })
    if (limit) q = q.limit(parseInt(limit, 10))
    const list = await q.lean()
    const transactions = list.map((t) => ({
      id: String(t._id),
      userId: String(t.userId),
      categoryId: String(t.categoryId),
      type: t.type,
      amount: t.amount,
      categoryName: t.categoryName,
      note: t.note,
      date: t.date,
      paymentMethod: t.paymentMethod,
    }))
    res.json(transactions)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { type, amount, categoryId, categoryName, note, date, paymentMethod } = req.body
    if (!type || !amount || amount <= 0 || !categoryId || !categoryName || !date) {
      return res.status(400).json({ error: 'Invalid transaction data' })
    }
    const t = await Transaction.create({
      userId: req.user._id,
      type,
      amount: Number(amount),
      categoryId,
      categoryName: categoryName.trim(),
      note: (note || '').trim(),
      date: new Date(date),
      paymentMethod: (paymentMethod || '').trim(),
    })
    res.status(201).json({
      id: String(t._id),
      userId: String(t.userId),
      categoryId: String(t.categoryId),
      type: t.type,
      amount: t.amount,
      categoryName: t.categoryName,
      note: t.note,
      date: t.date,
      paymentMethod: t.paymentMethod,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const t = await Transaction.findOne({ _id: req.params.id, userId: req.user._id })
    if (!t) return res.status(404).json({ error: 'Transaction not found' })
    const { amount, categoryId, categoryName, note, date, paymentMethod } = req.body
    if (amount != null) t.amount = Number(amount)
    if (categoryId) t.categoryId = categoryId
    if (categoryName) t.categoryName = categoryName.trim()
    if (note !== undefined) t.note = note.trim()
    if (date) t.date = new Date(date)
    if (paymentMethod !== undefined) t.paymentMethod = paymentMethod.trim()
    await t.save()
    res.json({
      id: String(t._id),
      userId: String(t.userId),
      categoryId: String(t.categoryId),
      type: t.type,
      amount: t.amount,
      categoryName: t.categoryName,
      note: t.note,
      date: t.date,
      paymentMethod: t.paymentMethod,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const result = await Transaction.deleteOne({ _id: req.params.id, userId: req.user._id })
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Transaction not found' })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
