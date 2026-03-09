# Module Design Document

## Todo Application - Detailed Module Design

### Table of Contents
1. [Module Overview](#1-module-overview)
2. [Backend Modules](#2-backend-modules)
3. [Frontend Modules](#3-frontend-modules)
4. [Module Dependencies](#4-module-dependencies)
5. [Module Interfaces](#5-module-interfaces)

---

### 1. Module Overview

The Todo Application is organized into clearly defined modules with single responsibility principle. The system is divided into two main packages: `api` (backend) and `frontend`.

```
todo-app/
├── api/                          # Backend API Server
│   ├── controllers/              # Request handlers
│   ├── middleware/               # Express middleware
│   ├── models/                   # MongoDB schemas
│   ├── schemas/                  # Zod validation schemas
│   ├── services/                 # Business logic services
│   └── utils/                    # Utility functions
│
└── frontend/                     # React SPA
    ├── src/
    │   ├── components/           # UI Components
    │   ├── pages/                # Page components
    │   ├── hooks/                # Custom React hooks
    │   ├── services/             # API and business services
    │   ├── theme/                # Theming system
    │   └── utils/                # Utility functions
    └── public/                   # Static assets
```

---

### 2. Backend Modules

#### 2.1 Controllers Module (`api/controllers/`)

The controllers module handles HTTP request/response handling. Each controller focuses on a specific resource domain.

```
api/controllers/
├── auth.ts              # Authentication (register, login, logout, password reset)
├── googleAuth.ts        # Google OAuth 2.0 integration
├── todo.ts             # Todo CRUD operations
├── admin.ts            # Admin dashboard and management
└── emailCheck.ts       # Email availability validation
```

##### Auth Controller (`auth.ts`)
**Responsibilities:**
- User registration with email/password
- User login/logout
- JWT token generation and refresh
- Password reset flow
- Email verification
- Profile management
- Session management

**Public API:**
```typescript
// Authentication
register(req: Request, res: Response): Promise<Response>
login(req: Request, res: Response): Promise<Response>
logout(req: Request, res: Response): Promise<Response>
verifyEmail(req: Request, res: Response): Promise<Response>
requestPasswordReset(req: Request, res: Response): Promise<Response>
resetPassword(req: Request, res: Response): Promise<Response>
refreshToken(req: Request, res: Response): Promise<Response>

// Profile
getProfile(req: Request, res: Response): Promise<Response>
updateProfile(req: Request, res: Response): Promise<Response>
deleteUser(req: Request, res: Response): Promise<Response>

// Sessions
getSessions(req: Request, res: Response): Promise<Response>
revokeSession(req: Request, res: Response): Promise<Response>
revokeAllSessions(req: Request, res: Response): Promise<Response>

// Onboarding
getOnboardingStatus(req: Request, res: Response): Promise<Response>
completeOnboarding(req: Request, res: Response): Promise<Response>
updateQuickStartProgress(req: Request, res: Response): Promise<Response>
resetOnboarding(req: Request, res: Response): Promise<Response>
```

##### Todo Controller (`todo.ts`)
**Responsibilities:**
- Todo CRUD operations
- Todo reordering (drag and drop)
- Todo filtering and pagination
- Query caching

**Public API:**
```typescript
getTodos(req: Request, res: Response): Promise<Response>
createTodo(req: Request, res: Response): Promise<Response>
updateTodo(req: Request, res: Response): Promise<Response>
deleteTodo(req: Request, res: Response): Promise<Response>
reorderTodos(req: Request, res: Response): Promise<Response>
```

##### Google Auth Controller (`googleAuth.ts`)
**Responsibilities:**
- Google OAuth URL generation
- OAuth callback handling
- Account linking/unlinking
- Google auth status

**Public API:**
```typescript
getGoogleAuthUrlHandler(req: Request, res: Response): Promise<Response>
googleCallback(req: Request, res: Response): Promise<Response>
googleError(req: Request, res: Response): Promise<Response>
linkGoogleAccount(req: Request, res: Response): Promise<Response>
unlinkGoogleAccount(req: Request, res: Response): Promise<Response>
getGoogleAuthStatus(req: Request, res: Response): Promise<Response>
```

##### Admin Controller (`admin.ts`)
**Responsibilities:**
- Dashboard statistics
- User management (CRUD)
- Todo management
- System health monitoring

**Public API:**
```typescript
getDashboardStats(req: Request, res: Response): Promise<Response>
getAllUsers(req: Request, res: Response): Promise<Response>
getUserDetails(req: Request, res: Response): Promise<Response>
updateUser(req: Request, res: Response): Promise<Response>
adminDeleteUser(req: Request, res: Response): Promise<Response>
getAllTodos(req: Request, res: Response): Promise<Response>
adminDeleteTodo(req: Request, res: Response): Promise<Response>
deleteMultipleTodos(req: Request, res: Response): Promise<Response>
getSystemHealth(req: Request, res: Response): Promise<Response>
```

---

#### 2.2 Middleware Module (`api/middleware/`)

Middleware functions process requests before they reach controllers.

```
api/middleware/
├── auth.ts           # JWT authentication
├── admin.ts          # Admin authorization
└── rateLimiter.ts    # Rate limiting
```

##### Auth Middleware (`auth.ts`)
**Responsibilities:**
- JWT token validation
- User session caching
- Request user attachment

**Flow:**
```
Request → Cookie Parse → Auth Middleware → Controller
                    │
                    ▼
            Validate JWT Token
                    │
            ├── Valid ──▶ Attach user to request → Next()
            │
            └── Invalid ──▶ Return 401
```

**Key Functions:**
```typescript
protect(req: Request, res: Response, next: NextFunction): Promise<void>
```

##### Admin Middleware (`admin.ts`)
**Responsibilities:**
- Verify admin role
- Admin-only route protection

**Key Functions:**
```typescript
adminProtect(req: Request, res: Response, next: NextFunction): Promise<void>
```

##### Rate Limiter Middleware (`rateLimiter.ts`)
**Responsibilities:**
- General API rate limiting
- Login attempt limiting
- Registration limiting
- Password reset limiting

**Key Functions:**
```typescript
apiLimiter: RateLimitRequestHandler
loginLimiter: RateLimitRequestHandler
registerLimiter: RateLimitRequestHandler
passwordResetLimiter: RateLimitRequestHandler
```

---

#### 2.3 Models Module (`api/models/`)

MongoDB/Mongoose schema definitions.

```
api/models/
├── User.ts            # User schema
├── Todo.ts            # Todo schema
└── RefreshToken.ts    # Refresh token schema
```

##### User Model (`User.ts`)
**Schema Fields:**
```typescript
{
  email: string;              // Required, unique, indexed
  password: string;            // Hashed password
  displayName: string;         // User's display name
  role: 'user' | 'admin';     // User role
  authProvider: 'local' | 'google';
  isGoogleUser: boolean;
  googleId: string;
  googleProfile: {
    picture: string;
    givenName: string;
    familyName: string;
  };
  emailVerified: boolean;
  emailVerificationToken: string;
  emailVerificationExpires: Date;
  passwordResetToken: string;
  passwordResetExpires: Date;
  failedLoginAttempts: number;
  accountLockedUntil: Date;
  lastLoginAt: Date;
  bio: string;
  avatar: string;
  encryptionSalt: string;     // For client-side encryption
  emailDripSchedule: {
    day1WelcomeSent: boolean;
    day3TipsSent: boolean;
    day7CheckInSent: boolean;
  };
  hasCompletedOnboarding: boolean;
  onboardingCompletedAt: Date;
  quickStartProgress: {
    firstTask: boolean;
    categorize: boolean;
    setPriority: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
```typescript
{ email: 1 }
{ email: 1, emailVerified: 1 }
{ role: 1 }
{ isGoogleUser: 1 }
{ googleId: 1 }
{ lastLoginAt: -1 }
{ hasCompletedOnboarding: 1 }
```

##### Todo Model (`Todo.ts`)
**Schema Fields:**
```typescript
{
  text: string;               // Task description (encrypted)
  completed: boolean;
  user: ObjectId;              // Reference to User
  category: 'work' | 'personal' | 'shopping' | 'health' | 'other';
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  dueDate: Date;
  order: number;              // For sorting
  participants: [{
    id: string;
    name: string;
    avatar: string;
  }];
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
```typescript
{ user: 1, order: 1 }
{ user: 1, completed: 1 }
{ user: 1, category: 1 }
{ user: 1, dueDate: 1 }
{ user: 1, priority: 1 }
{ completed: 1, createdAt: -1 }
{ text: 'text' }              // Text search
```

##### RefreshToken Model (`RefreshToken.ts`)
**Schema Fields:**
```typescript
{
  user: ObjectId;              // Reference to User
  token: string;               // Hashed token
  device: {
    type: string;
    userAgent: string;
    ipAddress: string;
    name: string;
  };
  expiresAt: Date;
  revoked: boolean;
  revokedAt: Date;
  revocationReason: string;
  createdAt: Date;
}
```

---

#### 2.4 Services Module (`api/services/`)

Business logic services.

```
api/services/
└── emailDrip.ts       # Automated email sequences
```

##### Email Drip Service (`emailDrip.ts`)
**Responsibilities:**
- Schedule welcome email sequence
- Day 1, 3, 7 email automation
- User engagement tracking

**Public API:**
```typescript
class EmailDripService {
  scheduleEmailDrip(userId: string, email: string, displayName: string): Promise<void>
  sendDay1Welcome(userId: string): Promise<void>
  sendDay3Tips(userId: string): Promise<void>
  sendDay7CheckIn(userId: string): Promise<void>
  markEmailSent(userId: string, emailType: string): Promise<void>
  checkAndSendDueEmails(): Promise<void>
}
```

---

#### 2.5 Utilities Module (`api/utils/`)

Utility functions and helpers.

```
api/utils/
├── database.ts        # MongoDB connection management
├── sessionCache.ts    # In-memory session cache
├── logger.ts          # Logging utility
├── security.ts        # Security helpers (tokens, passwords)
├── email.ts           # Email sending
├── smtp.ts            # SMTP configuration
├── csrf.ts            # CSRF protection
└── crypto.ts          # Cryptographic utilities
```

##### Database Utility (`database.ts`)
**Responsibilities:**
- MongoDB connection management
- Connection pooling
- Auto-reconnection
- Query caching
- Health checks

**Public API:**
```typescript
connectDB(): Promise<boolean>
isDBConnected(): boolean
getDBState(): string
getConnectionStatus(): ConnectionStatus
healthCheck(): Promise<HealthCheckResult>
pingDB(): Promise<boolean>
forceReconnect(): Promise<boolean>
gracefulShutdown(signal: string): Promise<void>
queryCache: {
  get<T>(key: string): T | null
  set<T>(key: string, data: T, ttl?: number): void
  invalidate(pattern?: string): void
  invalidatePrefix(prefix: string): void
}
cachedQuery<T>(cacheKey: string, queryFn: () => Promise<T>, ttl?: number): Promise<T>
```

##### Session Cache (`sessionCache.ts`)
**Responsibilities:**
- In-memory user session caching
- Fast auth lookups

**Public API:**
```typescript
getCachedUser(userId: string): Promise<CachedUserData | null>
setCachedUser(userId: string, userData: CachedUserData): Promise<void>
invalidateUserCache(userId: string): Promise<void>
clearExpiredSessions(): Promise<void>
```

##### Logger (`logger.ts`)
**Responsibilities:**
- Structured logging
- Error tracking
- Debug mode support

**Public API:**
```typescript
logger: {
  info(message: string, ...args: any[]): void
  warn(message: string, ...args: any[]): void
  error(message: string, ...args: any[]): void
  debug(message: string, ...args: any[]): void
}
```

##### Security (`security.ts`)
**Responsibilities:**
- Token generation
- Password validation
- Input sanitization

**Public API:**
```typescript
generateVerificationToken(): string
generateResetToken(): string
validatePasswordStrength(password: PasswordStrengthValidation)
sanitizeInput(input: string): string
hashToken(token: string): string
verifyToken(token: string, hash: string): boolean
```

---

### 3. Frontend Modules

#### 3.1 Components Module (`frontend/src/components/`)

UI components organized by complexity.

```
frontend/src/components/
├── AuthForm.tsx              # Login/Register form
├── TodoForm.tsx              # Add todo form
├── TodoList.tsx              # Todo list container
├── TodoItem.tsx              # Individual todo
├── SortableTodoList.tsx      # Drag-and-drop list
├── SortableTodoItem.tsx      # Draggable todo
├── SmartTodoList.tsx         # Smart filtering/sorting
├── ThemeSelector.tsx         # Theme picker
├── ProfileModal.tsx          # User profile modal
├── GoogleAuthHandler.tsx     # OAuth callback handler
├── WelcomeBackModal.tsx      # Welcome back modal
├── WelcomeTour.tsx           # Onboarding tour
├── QuickStartChecklist.tsx  # Quick start guide
├── PWAInstallPrompt.tsx      # PWA install banner
├── PremiumFeaturesModal.tsx  # Premium features
├── ConfirmDialog.tsx        # Confirmation dialog
├── ErrorBoundary.tsx         # Error handling
├── Footer.tsx                # Footer component
├── LEDIndicator.tsx         # Status LED
├── MessageBanner.tsx        # Message display
├── GeometryLoader.tsx       # Loading spinner
├── JoyrideTour.tsx          # Interactive tour
└── ui/                      # UI primitives
    ├── Button.tsx
    ├── Card.tsx
    ├── Input.tsx
    └── Modal.tsx
```

##### AuthForm Component
**Responsibilities:**
- Login form
- Registration form
- Form validation
- Error display

**Props:**
```typescript
interface AuthFormProps {
  onLogin: (email: string, password: string) => Promise<void>
  onRegister: (email: string, password: string, displayName: string) => Promise<void>
}
```

##### SmartTodoList Component
**Responsibilities:**
- Todo filtering (by category, priority)
- Todo sorting
- Drag-and-drop reordering
- Search functionality
- Batch operations

**Props:**
```typescript
interface SmartTodoListProps {
  todos: Todo[]
  onToggle: (todo: Todo) => Promise<void>
  onDelete: (todoId: string) => void
  onReorder: (todos: Todo[]) => Promise<void>
  sortable?: boolean
}
```

---

#### 3.2 Services Module (`frontend/src/services/`)

Frontend services for API and offline functionality.

```
frontend/src/services/
├── api.ts              # Axios API client
├── offlineStorage.ts   # IndexedDB storage
└── onboarding.ts       # Onboarding service
```

##### API Service (`api.ts`)
**Responsibilities:**
- HTTP client configuration
- Request/response interceptors
- Token refresh handling
- Error handling

**Public API:**
```typescript
const api: AxiosInstance

// Auth API
authApi: {
  register(email: string, password: string, displayName: string): Promise<AuthResponse>
  login(email: string, password: string): Promise<AuthResponse>
  logout(): Promise<void>
  verifyEmail(token: string): Promise<void>
  requestPasswordReset(email: string): Promise<void>
  resetPassword(token: string, password: string): Promise<void>
  refreshToken(): Promise<{ accessToken: string }>
  getMe(): Promise<{ user: User; encryptionSalt: string }>
}

// Todo API
todoApi: {
  getTodos(): Promise<Todo[]>
  createTodo(todo: Partial<Todo>): Promise<Todo>
  updateTodo(id: string, updates: Partial<Todo>): Promise<Todo>
  deleteTodo(id: string): Promise<void>
}

// Admin API
adminApi: {
  getDashboard(): Promise<AdminDashboardData>
  getUsers(params?: UserQueryParams): Promise<AdminUsersResponse>
  getUser(userId: string): Promise<AdminUserDetails>
  updateUser(userId: string, data: Partial<AdminUser>): Promise<AdminUser>
  deleteUser(userId: string): Promise<void>
  getTodos(params?: TodoQueryParams): Promise<AdminTodosResponse>
  getSystemHealth(): Promise<SystemHealth>
}
```

##### Offline Storage (`offlineStorage.ts`)
**Responsibilities:**
- IndexedDB operations
- Todo persistence
- Password/salt storage
- Offline-first support

**Public API:**
```typescript
offlineStorage: {
  saveTodos(todos: Todo[]): Promise<void>
  getAllTodos(): Promise<Todo[]>
  clearTodos(): Promise<void>
  savePassword(password: string): Promise<void>
  getPassword(): Promise<string | null>
  clearPassword(): Promise<void>
  saveEncryptionSalt(salt: string): Promise<void>
  getEncryptionSalt(): Promise<string | null>
  clearEncryptionSalt(): Promise<void>
  clearAll(): Promise<void>
}
```

---

#### 3.3 Hooks Module (`frontend/src/hooks/`)

Custom React hooks.

```
frontend/src/hooks/
├── index.ts            # Hook exports
├── useAuth.ts          # Authentication hook
└── useTodoFilters.ts   # Todo filtering hook
```

##### useAuth Hook
**Responsibilities:**
- Auth state management
- Login/logout actions
- User data access

##### useTodoFilters Hook
**Responsibilities:**
- Filter state management
- Filtered todos computation
- Sort preferences

---

#### 3.4 Theme Module (`frontend/src/theme/`)

Theming system.

```
frontend/src/theme/
├── index.ts            # Theme exports
├── ThemeContext.tsx    # Theme provider
├── themes.ts           # Theme definitions
└── types.ts            # Theme types
```

**Available Themes:**
- Light Mode
- Dark Mode
- Custom themes (Nature, Ocean, Sunset, etc.)

---

### 4. Module Dependencies

#### Backend Dependency Graph
```
index.ts (Entry Point)
    │
    ├── controllers/
    │   ├── auth.ts ──────────▶ models/User.ts
    │   │                    ├── models/RefreshToken.ts
    │   │                    ├── schemas/auth.ts
    │   │                    ├── utils/security.ts
    │   │                    ├── utils/email.ts
    │   │                    ├── services/emailDrip.ts
    │   │                    └── utils/sessionCache.ts
    │   │
    │   ├── todo.ts ─────────▶ models/Todo.ts
    │   │                    └── utils/database.ts
    │   │
    │   ├── googleAuth.ts ───▶ models/User.ts
    │   │                    └── utils/security.ts
    │   │
    │   ├── admin.ts ────────▶ models/User.ts
    │   │                    ├── models/Todo.ts
    │   │                    └── utils/database.ts
    │   │
    │   └── emailCheck.ts ───▶ models/User.ts
    │
    ├── middleware/
    │   ├── auth.ts ─────────▶ utils/sessionCache.ts
    │   │                    ├── models/User.ts
    │   │                    └── logger.ts
    │   │
    │   ├── admin.ts ────────▶ models/User.ts
    │   │
    │   └── rateLimiter.ts
    │
    └── utils/
        ├── database.ts ─────▶ logger.ts
        ├── sessionCache.ts
        ├── logger.ts
        ├── security.ts
        ├── email.ts ────────▶ utils/smtp.ts
        └── smtp.ts
```

#### Frontend Dependency Graph
```
App.tsx (Root)
    │
    ├── components/
    │   ├── AuthForm.tsx ────▶ services/api.ts
    │   ├── SmartTodoList.tsx
    │   │   └── components/
    │   │       ├── TodoItem.tsx
    │   │       ├── SortableTodoItem.tsx
    │   │       └── SortableTodoList.tsx
    │   │
    │   ├── ThemeSelector.tsx ─▶ theme/ThemeContext.tsx
    │   ├── ProfileModal.tsx ──▶ services/api.ts
    │   └── ...
    │
    ├── services/
    │   ├── api.ts ──────────▶ types.ts
    │   ├── offlineStorage.ts
    │   └── onboarding.ts
    │
    ├── hooks/
    │   ├── useAuth.ts ──────▶ services/api.ts
    │   └── useTodoFilters.ts
    │
    ├── theme/
    │   ├── ThemeContext.tsx
    │   ├── themes.ts
    │   └── types.ts
    │
    └── utils/
        ├── crypto.ts
        ├── todoHelpers.ts
        └── todoIcons.ts
```

---

### 5. Module Interfaces

#### 5.1 Todo Interface
```typescript
interface Todo {
  _id: string
  text: string
  completed: boolean
  category: 'work' | 'personal' | 'shopping' | 'health' | 'other'
  priority: 'low' | 'medium' | 'high'
  tags: string[]
  dueDate: string | null
  order: number
  participants: Array<{
    id: string
    name: string
    avatar?: string
  }>
  createdAt: string
  updatedAt?: string
}
```

#### 5.2 User Interface
```typescript
interface User {
  id: string
  email: string
  displayName: string | null
  bio: string | null
  avatar: string | null
  role: 'user' | 'admin'
  authProvider: 'local' | 'google'
  isGoogleUser: boolean
  googleId?: string
  googleProfile?: {
    picture?: string
    givenName?: string
    familyName?: string
  }
}
```

#### 5.3 Auth Response Interface
```typescript
interface AuthResponse {
  message: string
  user: {
    id: string
    email: string
    displayName: string
  }
  encryptionSalt: string
}
```

#### 5.4 API Error Interface
```typescript
interface ApiError {
  error: string
  message?: string
  code?: string
  retryAfter?: number
}
```

---

### 6. Module Interaction Patterns

#### Request-Response Pattern
```
Client Request
      │
      ▼
Middleware Stack (Auth, Rate Limit, CORS)
      │
      ▼
Controller (Validation, Business Logic)
      │
      ▼
Model/Database (Data Access)
      │
      ▼
Response to Client
```

#### Event-Driven Pattern (Future)
```
User Action
      │
      ▼
Component Event
      │
      ▼
Service (API Call)
      │
      ▼
State Update (Context/Hooks)
      │
      ▼
UI Re-render
```

#### Cache-Aside Pattern
```
Request
      │
      ▼
Check Cache
      │
      ├── Hit ──▶ Return Cached Data
      │
      └── Miss ──▶ Query Database
                        │
                        ▼
                  Update Cache
                        │
                        ▼
                  Return Data
```

---

*Document Version: 1.0*
*Last Updated: Auto-generated from codebase analysis*

