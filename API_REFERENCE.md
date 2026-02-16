# API Reference - Security & UX Features

## Authentication Endpoints

### Register
```
POST /api/auth/register
Rate Limited: 5 per hour per IP

Request:
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "displayName": "John Doe" (optional)
}

Response (201):
{
  "message": "Account created. Please check your email to verify.",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "displayName": "John Doe"
  }
}

Errors:
- 400: Invalid input (password too weak, invalid email)
- 409: Email already in use
- 429: Too many registration attempts
```

### Login
```
POST /api/auth/login
Rate Limited: 5 per minute per IP
Account Lockout: After 5 failed attempts (15 min lock)

Request:
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response (200):
{
  "message": "Logged in",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "displayName": "John Doe"
  }
}

Errors:
- 401: Invalid credentials
- 429: Account locked or too many attempts
```

### Verify Email
```
POST /api/auth/verify-email

Request:
{
  "token": "verification_token_from_email"
}

Response (200):
{
  "message": "Email verified successfully"
}

Errors:
- 400: Invalid or expired verification token
```

### Request Password Reset
```
POST /api/auth/request-password-reset
Rate Limited: 3 per hour per IP

Request:
{
  "email": "user@example.com"
}

Response (200):
{
  "message": "If email exists, password reset link has been sent"
}

Note: Always returns success message (doesn't reveal if email exists)
```

### Reset Password
```
POST /api/auth/reset-password

Request:
{
  "token": "reset_token_from_email",
  "password": "NewSecurePass123!"
}

Response (200):
{
  "message": "Password reset successfully"
}

Errors:
- 400: Invalid or expired reset token
- 400: Password doesn't meet strength requirements
```

### Logout
```
POST /api/auth/logout

Response (200):
{
  "message": "Logged out successfully"
}

Note: Clears httpOnly auth_token cookie
```

## Profile Endpoints

### Get Profile
```
GET /api/profile
Protected: Requires valid JWT token

Response (200):
{
  "_id": "user_id",
  "email": "user@example.com",
  "displayName": "John Doe",
  "bio": "Software developer",
  "avatar": "https://example.com/avatar.jpg",
  "emailVerified": true,
  "lastLoginAt": "2024-02-16T10:30:00Z",
  "createdAt": "2024-02-01T08:00:00Z",
  "updatedAt": "2024-02-16T10:30:00Z"
}

Errors:
- 401: Not authenticated
- 404: User not found
```

### Update Profile
```
PUT /api/profile
Protected: Requires valid JWT token

Request:
{
  "displayName": "Jane Doe" (optional),
  "bio": "Updated bio" (optional),
  "avatar": "https://example.com/new-avatar.jpg" (optional)
}

Response (200):
{
  "message": "Profile updated",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "displayName": "Jane Doe",
    "bio": "Updated bio"
  }
}

Errors:
- 400: Invalid input
- 401: Not authenticated
- 404: User not found
```

## Todo Endpoints

### Get Todos
```
GET /api/todos
Protected: Requires valid JWT token

Response (200):
[
  {
    "_id": "todo_id",
    "text": "Buy groceries",
    "completed": false,
    "category": "shopping",
    "tags": ["urgent", "food"],
    "priority": "high",
    "user": "user_id",
    "createdAt": "2024-02-16T10:00:00Z",
    "updatedAt": "2024-02-16T10:00:00Z"
  }
]

Errors:
- 401: Not authenticated
```

### Create Todo
```
POST /api/todos
Protected: Requires valid JWT token

Request:
{
  "text": "Buy groceries",
  "category": "shopping" (optional: work, personal, shopping, health, other),
  "tags": ["urgent", "food"] (optional),
  "priority": "high" (optional: low, medium, high)
}

Response (201):
{
  "_id": "todo_id",
  "text": "Buy groceries",
  "completed": false,
  "category": "shopping",
  "tags": ["urgent", "food"],
  "priority": "high",
  "user": "user_id",
  "createdAt": "2024-02-16T10:00:00Z",
  "updatedAt": "2024-02-16T10:00:00Z"
}

Errors:
- 400: Invalid input
- 401: Not authenticated
```

### Update Todo
```
PUT /api/todos/:id
Protected: Requires valid JWT token

Request:
{
  "text": "Updated text" (optional),
  "completed": true (optional),
  "category": "work" (optional),
  "tags": ["new-tag"] (optional),
  "priority": "medium" (optional)
}

Response (200):
{
  "_id": "todo_id",
  "text": "Updated text",
  "completed": true,
  "category": "work",
  "tags": ["new-tag"],
  "priority": "medium",
  "user": "user_id",
  "createdAt": "2024-02-16T10:00:00Z",
  "updatedAt": "2024-02-16T10:30:00Z"
}

Errors:
- 400: Invalid input
- 401: Not authenticated
- 404: Todo not found or not owned by user
```

### Delete Todo
```
DELETE /api/todos/:id
Protected: Requires valid JWT token

Response (200):
{
  "message": "Todo deleted"
}

Errors:
- 401: Not authenticated
- 404: Todo not found or not owned by user
```

## Error Responses

### Rate Limiting (429)
```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

### Account Lockout (429)
```json
{
  "error": "Account temporarily locked due to too many failed attempts. Try again later."
}
```

### Validation Error (400)
```json
{
  "error": "Password must contain an uppercase letter"
}
```

### Unauthorized (401)
```json
{
  "error": "Not authenticated"
}
```

### Not Found (404)
```json
{
  "error": "Todo not found or not owned by user"
}
```

### Conflict (409)
```json
{
  "error": "Email already in use"
}
```

### Server Error (500)
```json
{
  "error": "Internal server error"
}
```

## Password Strength Requirements

Password must contain:
- ✓ Minimum 8 characters
- ✓ At least one uppercase letter (A-Z)
- ✓ At least one lowercase letter (a-z)
- ✓ At least one number (0-9)
- ✓ At least one special character (!@#$%^&*)

Example valid passwords:
- `SecurePass123!`
- `MyP@ssw0rd`
- `Test#1234`

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| General API | 100 requests | 15 minutes |
| Login | 5 attempts | 1 minute |
| Registration | 5 registrations | 1 hour |
| Password Reset | 3 requests | 1 hour |

## Token Expiration

| Token Type | Expiration |
|-----------|-----------|
| JWT Auth Token | 7 days |
| Email Verification | 24 hours |
| Password Reset | 1 hour |

## Security Headers

All responses include:
- `X-RateLimit-Limit`: Rate limit for endpoint
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Unix timestamp when limit resets

## Cookie Configuration

Auth token cookie:
- **Name**: `auth_token`
- **HttpOnly**: true (prevents JavaScript access)
- **Secure**: true (HTTPS only in production)
- **SameSite**: none (production) / strict (development)
- **MaxAge**: 7 days

## CORS Configuration

Allowed origins:
- `http://localhost:5173` (local development)
- `https://metb-todo.vercel.app` (production)
- `https://*.vercel.app` (Vercel previews)

Allowed methods: GET, POST, PUT, DELETE, OPTIONS
Allowed headers: Content-Type, Authorization
Credentials: true (cookies included)
