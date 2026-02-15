import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true, enum: ['income', 'expense'] },
    amount: { type: Number, required: true, min: 0.01 },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    categoryName: { type: String, required: true },
    note: { type: String, default: '' },
    date: { type: Date, required: true },
    paymentMethod: { type: String, default: '' },
  },
  { timestamps: true }
)

transactionSchema.index({ userId: 1, date: -1 })

export default mongoose.model('Transaction', transactionSchema)
