# Setup Guide for Security & UX Features

## Backend Setup

### 1. Install Dependencies
```bash
cd api
bun install
# or
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in:

```bash
# Required
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-secret-key-min-32-chars
FRONTEND_URL=http://localhost:5173

# Email (for verification and password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@todoapp.com
```

### 3. Email Configuration (Gmail Example)
1. Enable 2-Factor Authentication on Gmail
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the generated password as `SMTP_PASS`

### 4. Start Backend
```bash
bun run api/index.ts
# or
npm start
```

## Frontend Setup

### 1. Install Dependencies
```bash
cd frontend
bun install
# or
npm install
```

### 2. Create New Pages

#### VerifyEmail.tsx
```typescript
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      const token = searchParams.get('token');
      if (!token) {
        setStatus('error');
        setMessage('No verification token provided');
        return;
      }

      try {
        await axios.post('/api/auth/verify-email', { token });
        setStatus('success');
        setMessage('Email verified! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.error || 'Verification failed');
      }
    };

    verify();
  }, [searchParams, navigate]);

  return (
    <div className="verify-email">
      {status === 'loading' && <p>Verifying email...</p>}
      {status === 'success' && <p className="success">{message}</p>}
      {status === 'error' && <p className="error">{message}</p>}
    </div>
  );
}
```

#### ForgotPassword.tsx
```typescript
import { useState } from 'react';
import axios from 'axios';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post('/api/auth/request-password-reset', { email });
      setMessage('Password reset link sent to your email');
      setEmail('');
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Sending...' : 'Send Reset Link'}
      </button>
      {message && <p>{message}</p>}
    </form>
  );
}
```

#### ResetPassword.tsx
```typescript
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setMessage('No reset token provided');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await axios.post('/api/auth/reset-password', {
        token,
        password,
      });
      setMessage('Password reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="New password"
        required
      />
      <input
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirm password"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>
      {message && <p>{message}</p>}
    </form>
  );
}
```

#### Profile.tsx
```typescript
import { useState, useEffect } from 'react';
import axios from 'axios';

export function Profile() {
  const [user, setUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get('/api/profile', {
          withCredentials: true,
        });
        setUser(response.data);
        setDisplayName(response.data.displayName);
        setBio(response.data.bio || '');
      } catch (error) {
        setMessage('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.put('/api/profile', 
        { displayName, bio },
        { withCredentials: true }
      );
      setMessage('Profile updated successfully');
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="profile">
      <h2>Profile</h2>
      <p>Email: {user?.email}</p>
      <p>Email Verified: {user?.emailVerified ? '✓' : '✗'}</p>
      <p>Last Login: {new Date(user?.lastLoginAt).toLocaleString()}</p>
      
      <form onSubmit={handleUpdate}>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Display Name"
        />
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Bio (max 500 characters)"
          maxLength={500}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
      
      {message && <p>{message}</p>}
    </div>
  );
}
```

### 3. Update Routes
Add new routes to your router configuration:

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

### 4. Update Login/Register Forms
Add links to forgot password and update error handling for rate limiting.

## Testing the Features

### 1. Test Rate Limiting
```bash
# Try logging in 6 times quickly
# Should get 429 error on 6th attempt
```

### 2. Test Account Lockout
```bash
# Make 5 failed login attempts
# Account should lock for 15 minutes
# Try again - should get lockout message
```

### 3. Test Email Verification
```bash
# Register new account
# Check email for verification link
# Click link to verify
# Should redirect to login
```

### 4. Test Password Reset
```bash
# Click "Forgot Password"
# Enter email
# Check email for reset link
# Click link and reset password
# Login with new password
```

### 5. Test Profile Management
```bash
# Login
# Go to profile page
# Update display name and bio
# Verify changes saved
```

## Troubleshooting

### Email Not Sending
1. Check SMTP credentials in `.env`
2. Verify Gmail App Password is correct
3. Check firewall/network settings
4. Look at server logs for errors

### Rate Limiting Not Working
1. Verify `express-rate-limit` is installed
2. Check middleware order in `api/index.ts`
3. Ensure rate limiter is applied before routes

### Account Lockout Not Working
1. Check User model has `failedLoginAttempts` and `accountLockedUntil` fields
2. Verify MongoDB is running
3. Check server logs for errors

### Verification Token Invalid
1. Ensure token is passed correctly in URL
2. Check token hasn't expired (24 hours)
3. Verify token matches in database

## Next Steps

1. Implement CAPTCHA for registration (Google reCAPTCHA v3)
2. Add two-factor authentication (TOTP)
3. Implement session management (multiple devices)
4. Add audit logging for security events
5. Implement password history
6. Add email change verification
7. Implement account deletion with confirmation
