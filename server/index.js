import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { connectDB } from './config/db.js'
import authRoutes from './routes/auth.js'
import categoriesRoutes from './routes/categories.js'
import transactionsRoutes from './routes/transactions.js'
import seedRoutes from './routes/seed.js'
import budgetsRoutes from './routes/budgets.js'

await connectDB()

const app = express()
// CORS configuration for both web and mobile (React Native/Expo)
app.use(cors({ 
  origin: [
    'http://localhost:5173', 
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://10.0.2.2:3000', // Android Emulator
    'exp://*', // Expo
  ], 
  credentials: true 
}))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/categories', categoriesRoutes)
app.use('/api/transactions', transactionsRoutes)
app.use('/api/seed', seedRoutes)
app.use('/api/budgets', budgetsRoutes)
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});


const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
