import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true, enum: ['income', 'expense'] },
  },
  { timestamps: true }
)

export default mongoose.model('Category', categorySchema)
