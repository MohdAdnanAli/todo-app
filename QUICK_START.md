# Quick Start Guide

## 5-Minute Setup

### 1. Install Dependencies
```bash
cd api
bun install
# or: npm install
```

### 2. Configure Environment
```bash
# Copy and edit .env
cp .env.example .env

# Edit .env with:
MONGODB_URI=your-mongodb-url
JWT_SECRET=your-secret-key-min-32-chars
FRONTEND_URL=http://localhost:5173
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@todoapp.com
```

### 3. Start Backend
```bash
bun run api/index.ts
# Server runs on http://localhost:5000
```

### 4. Test Backend
```bash
# In another terminal
curl http://localhost:5000/health
# Should return: {"status":"ok","db":"connected"}
```

## Testing the Features

### Test 1: Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "displayName": "Test User"
  }'
```

### Test 2: Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

### Test 3: Get Profile
```bash
curl http://localhost:5000/api/profile \
  -b cookies.txt
```

### Test 4: Create Todo
```bash
curl -X POST http://localhost:5000/api/todos \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "text": "Buy groceries",
    "category": "shopping",
    "priority": "high",
    "tags": ["urgent"]
  }'
```

### Test 5: Rate Limiting
```bash
# Try logging in 6 times quickly
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "password": "wrong"
    }'
done
# 6th request should return 429 (Too Many Requests)
```

## Frontend Integration

### 1. Create Pages
Create these files in `frontend/src/pages/`:
- `VerifyEmail.tsx`
- `ForgotPassword.tsx`
- `ResetPassword.tsx`
- `Profile.tsx`

See `SETUP_GUIDE.md` for code examples.

### 2. Add Routes
```typescript
import { VerifyEmail } from './pages/VerifyEmail';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Profile } from './pages/Profile';

// In your router:
<Route path="/verify-email" element={<VerifyEmail />} />
<Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password" element={<ResetPassword />} />
<Route path="/profile" element={<Profile />} />
```

### 3. Update Login Form
Add link to forgot password:
```typescript
<a href="/forgot-password">Forgot password?</a>
```

### 4. Add Profile Link
Add link in navigation:
```typescript
<a href="/profile">Profile</a>
```

## Key Features

### Security
✅ Rate limiting (5 login attempts/min)
✅ Account lockout (15 min after 5 failures)
✅ Email verification
✅ Password reset
✅ Strong password requirements
✅ XSS prevention
✅ Secure cookies

### User Experience
✅ Profile management
✅ Todo categories
✅ Todo tags
✅ Todo priority
✅ Last login tracking
✅ Email verification status

## API Endpoints

### Auth
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/verify-email` - Verify email
- `POST /api/auth/request-password-reset` - Request reset
- `POST /api/auth/reset-password` - Reset password

### Profile
- `GET /api/profile` - Get profile
- `PUT /api/profile` - Update profile

### Todos
- `GET /api/todos` - Get todos
- `POST /api/todos` - Create todo
- `PUT /api/todos/:id` - Update todo
- `DELETE /api/todos/:id` - Delete todo

## Password Requirements

Must contain:
- ✓ 8+ characters
- ✓ Uppercase letter
- ✓ Lowercase letter
- ✓ Number
- ✓ Special character (!@#$%^&*)

Example: `SecurePass123!`

## Troubleshooting

### Email Not Sending
1. Check SMTP credentials in `.env`
2. Verify Gmail App Password
3. Check firewall settings
4. Look at server logs

### Rate Limiting Not Working
1. Verify `express-rate-limit` installed
2. Check middleware order in `api/index.ts`
3. Restart server

### Account Lockout Not Working
1. Check User model has required fields
2. Verify MongoDB is running
3. Check server logs

### Verification Token Invalid
1. Check token in URL
2. Verify token hasn't expired (24 hours)
3. Check database

## Next Steps

1. ✅ Backend setup complete
2. ⏳ Create frontend pages
3. ⏳ Add routes
4. ⏳ Test all features
5. ⏳ Deploy to Vercel

## Documentation

- `SECURITY_UX_FEATURES.md` - Feature overview
- `API_REFERENCE.md` - Complete API docs
- `SETUP_GUIDE.md` - Detailed setup
- `FRONTEND_INTEGRATION.md` - Frontend guide
- `DEPLOYMENT_CHECKLIST.md` - Deployment steps

## Support

For issues:
1. Check `SETUP_GUIDE.md` troubleshooting section
2. Review server logs
3. Check `.env` configuration
4. Verify MongoDB connection
5. Test with curl commands

---

**Status**: Backend Ready ✅
**Next**: Frontend Integration
**Time Estimate**: 2-3 hours
