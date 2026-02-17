# Frontend Integration Guide

This guide explains how to integrate the new security and UX features into the frontend.

## New API Endpoints to Implement

### Authentication Endpoints

#### 1. Email Verification
```typescript
// After registration, user receives email with verification link
POST /api/auth/verify-email
Body: { token: string }
Response: { message: string }
```

**Frontend Flow**:
1. User clicks verification link in email
2. Extract token from URL query parameter
3. Call verify endpoint
4. Show success/error message

#### 2. Password Reset Request
```typescript
POST /api/auth/request-password-reset
Body: { email: string }
Response: { message: string }
```

**Frontend Flow**:
1. User enters email on "Forgot Password" page
2. Call endpoint (rate limited to 3/hour)
3. Show "Check your email" message
4. User clicks link in email

#### 3. Password Reset
```typescript
POST /api/auth/reset-password
Body: { token: string, password: string }
Response: { message: string }
```

**Frontend Flow**:
1. User clicks reset link from email
2. Extract token from URL
3. Show password reset form
4. Validate password strength in real-time
5. Call endpoint with new password
6. Redirect to login

#### 4. Profile Endpoints
```typescript
GET /api/profile
Response: {
  _id: string
  email: string
  displayName: string
  bio: string
  avatar: string
  emailVerified: boolean
  lastLoginAt: Date
  createdAt: Date
}

PUT /api/profile
Body: { displayName?: string, bio?: string, avatar?: string }
Response: { message: string, user: UserObject }
```

## Frontend Components to Create

### 1. Email Verification Page
```typescript
// pages/VerifyEmail.tsx
- Extract token from URL
- Show loading state
- Call verify endpoint
- Show success/error message
- Auto-redirect to login on success
```

### 2. Forgot Password Page
```typescript
// pages/ForgotPassword.tsx
- Email input field
- Submit button (disabled during request)
- Rate limit feedback (3 attempts/hour)
- Success message with email confirmation
```

### 3. Reset Password Page
```typescript
// pages/ResetPassword.tsx
- Extract token from URL
- Password input with strength indicator
- Confirm password field
- Real-time validation feedback
- Submit button
- Error handling for expired tokens
```

### 4. Profile Page
```typescript
// pages/Profile.tsx
- Display user info (email, display name, bio, avatar)
- Edit form for profile fields
- Avatar upload (optional)
- Email verification status
- Last login timestamp
- Account creation date
- Save/Cancel buttons
```

### 5. Password Strength Indicator
```typescript
// components/PasswordStrengthIndicator.tsx
- Visual feedback for password requirements
- Show which requirements are met:
  - ✓ At least 8 characters
  - ✓ Uppercase letter
  - ✓ Lowercase letter
  - ✓ Number
  - ✓ Special character (!@#$%^&*)
- Color-coded strength meter
```

## Error Handling

### Rate Limiting Errors
```typescript
// 429 Too Many Requests
{
  error: "Too many login attempts, please try again later."
}

// Handle in frontend:
- Show user-friendly message
- Disable form temporarily
- Show countdown timer if possible
```

### Account Lockout
```typescript
// 429 Too Many Requests (after 5 failed attempts)
{
  error: "Account temporarily locked due to too many failed attempts. Try again later."
}

// Handle in frontend:
- Show lockout message
- Suggest password reset
- Show 15-minute countdown
```

### Invalid/Expired Tokens
```typescript
// 400 Bad Request
{
  error: "Invalid or expired verification token"
}

// Handle in frontend:
- Show error message
- Offer to resend verification email
- Redirect to request new reset token
```

## Password Strength Validation

Implement client-side validation that mirrors server-side:

```typescript
const validatePassword = (password: string) => {
  const errors: string[] = [];
  
  if (password.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('Uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('Number');
  if (!/[!@#$%^&*]/.test(password)) errors.push('Special character');
  
  return {
    valid: errors.length === 0,
    errors,
    strength: 5 - errors.length // 0-5 strength score
  };
};
```

## Updated Login Flow

```typescript
// Enhanced login with account lockout handling
const handleLogin = async (email: string, password: string) => {
  try {
    const response = await axios.post('/api/auth/login', 
      { email, password },
      { withCredentials: true }
    );
    
    // Success
    setUser(response.data.user);
    navigate('/todos');
    
  } catch (error: any) {
    if (error.response?.status === 429) {
      // Account locked or rate limited
      setError('Account temporarily locked. Try again in 15 minutes.');
      showPasswordResetSuggestion();
    } else if (error.response?.status === 401) {
      // Invalid credentials
      setError('Invalid email or password');
    } else {
      setError('Login failed. Please try again.');
    }
  }
};
```

## Updated Registration Flow

```typescript
// Enhanced registration with email verification
const handleRegister = async (email: string, password: string, displayName: string) => {
  try {
    const response = await axios.post('/api/auth/register',
      { email, password, displayName },
      { withCredentials: true }
    );
    
    // Show verification email message
    setMessage('Account created! Check your email to verify.');
    showVerificationPending();
    
  } catch (error: any) {
    if (error.response?.status === 429) {
      setError('Too many registration attempts. Try again later.');
    } else if (error.response?.status === 400) {
      setError(error.response.data.error);
    }
  }
};
```

## Todo Enhancements

### Update Todo Creation
```typescript
POST /api/todos
Body: {
  text: string
  category?: 'work' | 'personal' | 'shopping' | 'health' | 'other'
  tags?: string[]
  priority?: 'low' | 'medium' | 'high'
}
```

### Update Todo Display
```typescript
// Show category badge
// Show priority indicator
// Show tags
// Filter by category/priority
// Search by tags
```

## Security Best Practices for Frontend

1. **Never store sensitive tokens in localStorage**
   - Use httpOnly cookies (already handled by backend)
   - Cookies are automatically sent with requests

2. **Validate password strength before submission**
   - Provide real-time feedback
   - Prevent submission of weak passwords

3. **Sanitize user input**
   - Prevent XSS attacks
   - Backend also sanitizes, but frontend should too

4. **Handle rate limiting gracefully**
   - Show user-friendly messages
   - Disable forms during rate limit windows
   - Suggest alternatives (password reset)

5. **Secure password reset flow**
   - Verify token validity before showing form
   - Use HTTPS only in production
   - Clear sensitive data after use

## Testing Checklist

- [ ] Email verification link works
- [ ] Expired verification tokens show error
- [ ] Password reset email received
- [ ] Password reset link works
- [ ] Expired reset tokens show error
- [ ] Password strength indicator shows all requirements
- [ ] Profile page displays user info
- [ ] Profile update saves changes
- [ ] Rate limiting shows appropriate messages
- [ ] Account lockout message appears after 5 attempts
- [ ] Todo categories display correctly
- [ ] Todo tags can be added/removed
- [ ] Todo priority shows in UI
