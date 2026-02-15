# Backend Integration Setup Guide

## ✅ Setup Complete

Your Expense Manager app is now fully connected with the backend server.

### Configuration Summary

#### Backend Server
- **Status**: Running on `http://localhost:3001`
- **Database**: MongoDB (localhost:27017)
- **JWT Secret**: Configured for development
- **CORS**: Enabled for React Native, Expo, and Web

#### Frontend App
- **API URL**: `http://localhost:3001/api`
- **Android Emulator**: Use `http://10.0.2.2:3001/api`
- **Physical Device**: Use `http://192.168.137.1:3001/api` or your local IP

### Features Connected

✅ **Authentication**
- User Signup
- User Login
- Password Reset
- JWT Token Management
- Secure Token Storage (expo-secure-store)

✅ **Transactions**
- Create transactions
- List transactions with filters
- Update transactions
- Delete transactions

✅ **Categories**
- Manage expense/income categories
- Category-based filtering

✅ **Budgets**
- Set monthly budgets
- Budget alerts
- Exceed notifications

✅ **Reports**
- Monthly summaries
- Category breakdowns
- Expense tracking

### Backend Routes Available

```
POST   /api/auth/signup           - Register new user
POST   /api/auth/login            - Login user
POST   /api/auth/forgot-password  - Request password reset
POST   /api/auth/reset-password   - Reset password

GET    /api/categories            - List categories (filtered by type)
POST   /api/categories            - Create new category

GET    /api/transactions          - List transactions (with filters)
POST   /api/transactions          - Create transaction
PUT    /api/transactions/:id       - Update transaction
DELETE /api/transactions/:id       - Delete transaction

GET    /api/budgets               - List budgets (with year/month filters)
POST   /api/budgets               - Create budget
DELETE /api/budgets/:id          - Delete budget
GET    /api/budgets/alerts        - Get budget alerts

POST   /api/seed                  - Seed test data
```

### How to Start Development

#### 1. Start Backend Server
```bash
cd server
npm start
# or for watch mode:
npm run dev
```

#### 2. Start Frontend App
```bash
# In a new terminal
npm start
# Then choose:
# - Android emulator: press 'a'
# - iOS simulator: press 'i'
# - Expo Go: scan QR code with phone
```

### Testing the Connection

#### Test Signup (via cURL or Postman)
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

#### Expected Response
```json
{
  "user": {
    "id": "...",
    "email": "test@example.com",
    "name": "Test User"
  },
  "token": "eyJhbGc..."
}
```

### Environment Variables

Backend `.env` file is configured with:
- `PORT=3001`
- `MONGODB_URI=mongodb://127.0.0.1:27017/expense-manager`
- `JWT_SECRET=dev-secret-key-change-in-production`

### Troubleshooting

**Issue: Backend won't start on port 3001**
```bash
# Kill any existing process on port 3001
# Windows: netstat -ano | findstr :3001
# Then: taskkill /PID <PID> /F
```

**Issue: MongoDB connection fails**
```bash
# Ensure MongoDB is running
# Windows: mongod should be running
# Check: ping localhost:27017
```

**Issue: CORS errors on mobile device**
- Use correct IP address from config.js
- Run `ipconfig` to find your machine's IP
- Update API_URL in src/config.js
- Ensure device is on same network as backend

**Issue: "Token already exists" error**
- Clear app storage: Settings > Apps > [App Name] > Storage > Clear
- Or in Expo: Delete and reinstall

### Next Steps

1. **Test User Flow**
   - Sign up with a new account
   - Login to verify token works
   - Create some transactions
   - Set a budget
   - View reports

2. **Verify Data Persistence**
   - Logout and login again
   - Check data is saved in MongoDB

3. **Test On Device**
   - Use physical device with same network
   - Or Android emulator with `http://10.0.2.2:3001/api`

4. **Production Deployment**
   - Update JWT_SECRET with strong key
   - Switch to MongoDB Atlas (cloud)
   - Deploy backend to Heroku, Railway, or Vercel
   - Update API_URL to production URL
   - Build iOS/Android release
   - Submit to App Stores

### Security Checklist

- [ ] Change JWT_SECRET for production
- [ ] Setup rate limiting on backend
- [ ] Add request validation
- [ ] Setup HTTPS/SSL
- [ ] Add input sanitization
- [ ] Setup environment-specific configs
- [ ] Review CORS allowed origins
- [ ] Add API authentication logging
- [ ] Setup error monitoring (Sentry)
- [ ] Regular security audits

---

**Setup completed on**: February 15, 2026
**Backend version**: 1.0.0
**Frontend version**: 1.0.0
