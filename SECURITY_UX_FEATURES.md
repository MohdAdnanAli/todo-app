# Security & UX Features Foundation

This document outlines the security and user experience features that have been implemented.

## Security Features

### 1. Rate Limiting
- **General API**: 100 requests per 15 minutes per IP
- **Login**: 5 attempts per minute per IP
- **Registration**: 5 registrations per hour per IP
- **Password Reset**: 3 requests per hour per IP

**Implementation**: `api/middleware/rateLimiter.ts`
- Uses `express-rate-limit` package
- Automatically returns 429 (Too Many Requests) when limits exceeded
- Tracks by IP address

### 2. Account Lockout
- Locks account after 5 failed login attempts
- Lock duration: 15 minutes
- Automatically resets on successful login
- Prevents brute force attacks

**Implementation**: `api/controllers/auth.ts`
- Tracks `failedLoginAttempts` and `accountLockedUntil` in User model
- Returns 429 status when account is locked

### 3. Input Validation & Sanitization
- **XSS Prevention**: All user inputs sanitized using `xss` package
- **Schema Validation**: Zod schemas for all endpoints
- **Password Strength**: Enforces:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character (!@#$%^&*)

**Implementation**: 
- `api/utils/security.ts` - sanitization functions
- `api/schemas/auth.ts` - validation schemas

### 4. Email Verification
- Verification token sent on registration
- Token expires after 24 hours
- User must verify email before full account access (optional enforcement)
- Prevents spam registrations

**Implementation**: `api/controllers/auth.ts`
- `POST /api/auth/verify-email` - verify with token
- Stores `emailVerified`, `emailVerificationToken`, `emailVerificationExpires` in User model

### 5. Password Reset
- Secure token-based password reset flow
- Reset token expires after 1 hour
- Resets failed login attempts on successful reset
- Prevents account lockout after password reset

**Implementation**: `api/controllers/auth.ts`
- `POST /api/auth/request-password-reset` - request reset email
- `POST /api/auth/reset-password` - complete reset with token

### 6. Secure Password Storage
- bcryptjs with 12 salt rounds
- Industry-standard hashing algorithm
- Passwords never logged or exposed

## User Experience Features

### 1. Profile Management
- Update display name, bio, and avatar
- View complete profile information
- Sanitized input to prevent XSS

**Endpoints**:
- `GET /api/profile` - get user profile
- `PUT /api/profile` - update profile

### 2. Todo Enhancements
- **Categories**: work, personal, shopping, health, other
- **Tags**: Multiple tags per todo
- **Priority**: low, medium, high
- **Timestamps**: Created and updated timestamps

**Model**: `api/models/Todo.ts`
- New fields: `category`, `tags`, `priority`

### 3. Session Management
- 7-day JWT token expiration
- httpOnly cookies (prevents XSS token theft)
- Secure cookie flags for production
- Last login tracking

### 4. User Tracking
- Last login timestamp
- Account creation timestamp
- Account update timestamp

## Database Schema Updates

### User Model
```typescript
{
  email: String (unique, lowercase, trimmed)
  password: String (hashed)
  displayName: String
  
  // Email verification
  emailVerified: Boolean
  emailVerificationToken: String
  emailVerificationExpires: Date
  
  // Password reset
  passwordResetToken: String
  passwordResetExpires: Date
  
  // Account security
  failedLoginAttempts: Number
  accountLockedUntil: Date
  lastLoginAt: Date
  
  // Profile
  bio: String (max 500 chars)
  avatar: String (URL)
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
}
```

### Todo Model
```typescript
{
  text: String (max 500 chars)
  completed: Boolean
  user: ObjectId (reference to User)
  
  // New fields
  category: String (enum: work, personal, shopping, health, other)
  tags: [String]
  priority: String (enum: low, medium, high)
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
}
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (rate limited)
- `POST /api/auth/login` - Login (rate limited, account lockout)
- `POST /api/auth/logout` - Logout
- `POST /api/auth/verify-email` - Verify email with token
- `POST /api/auth/request-password-reset` - Request password reset (rate limited)
- `POST /api/auth/reset-password` - Reset password with token

### Profile
- `GET /api/profile` - Get user profile (protected)
- `PUT /api/profile` - Update user profile (protected)

### Todos
- `GET /api/todos` - Get all todos (protected)
- `POST /api/todos` - Create todo (protected)
- `PUT /api/todos/:id` - Update todo (protected)
- `DELETE /api/todos/:id` - Delete todo (protected)

## Environment Variables

Required for email functionality:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@todoapp.com
FRONTEND_URL=http://localhost:5173
```

## Future Enhancements

### CAPTCHA Integration
- Google reCAPTCHA v3 for registration
- Prevents automated bot registrations
- Transparent to legitimate users

### Two-Factor Authentication (2FA)
- TOTP-based authentication
- SMS-based backup codes
- Enhanced account security

### Advanced Rate Limiting
- Per-user rate limiting (not just IP)
- Sliding window algorithm
- Distributed rate limiting for multi-server deployments

### Audit Logging
- Track all authentication events
- Log failed login attempts
- Monitor suspicious activity

### Password History
- Prevent reuse of recent passwords
- Configurable history length

### Session Management
- Multiple active sessions per user
- Session revocation
- Device tracking

## Testing Checklist

- [ ] Rate limiting blocks excessive requests
- [ ] Account lockout after 5 failed attempts
- [ ] Account unlock after 15 minutes
- [ ] Email verification token validation
- [ ] Password reset token expiration
- [ ] Password strength validation
- [ ] XSS prevention in profile fields
- [ ] Profile update sanitization
- [ ] Todo category/tag filtering
- [ ] JWT token expiration
- [ ] httpOnly cookie security
