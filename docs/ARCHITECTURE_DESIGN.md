# Architecture Design Document

## Todo Application - System Architecture Overview

### 1. Executive Summary

This document outlines the high-level architecture of the Todo Application, a full-stack task management system with client-side encryption, multi-provider authentication, and administrative features.

### 2. System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     React SPA (Vite + TypeScript)                   │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │    │
│  │  │  Pages   │  │Components │  │  Hooks   │  │   Services       │  │    │
│  │  │          │  │          │  │          │  │   (API, Crypto)  │  │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTPS + Cookies
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY LAYER                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                  Express.js Middleware Stack                         │    │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐   │    │
│  │  │   CORS    │  │Compression │  │ Rate Limit │  │   Cookie   │   │    │
│  │  │            │  │            │  │            │  │   Parser   │   │    │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         Route Layer                                  │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │    │
│  │  │   /api/auth │  │  /api/todos │  │  /api/admin │                 │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
┌─────────────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐
│    AUTH SERVICE         │  │  TODO SERVICE   │  │   ADMIN SERVICE        │
│  ┌───────────────────┐  │  ┌─────────────┐  │  │  ┌─────────────────┐   │
│  │ - Registration    │  │  │ - CRUD      │  │  │  │ - User Mgmt     │   │
│  │ - Login/Logout   │  │  │ - Reorder   │  │  │  │ - Todo Mgmt     │   │
│  │ - JWT Tokens     │  │  │ - Filtering │  │  │  │ - Dashboard     │   │
│  │ - Google OAuth   │  │  │ - Search    │  │  │  │ - Analytics    │   │
│  │ - Email Verify   │  │  └─────────────┘  │  │  └─────────────────┘   │
│  │ - Password Reset │  │                   │  │                         │
│  └───────────────────┘  │                   │  │                         │
└─────────────────────────┘  └─────────────────┘  └─────────────────────────┘
          │                         │                         │
          └─────────────────────────┼─────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    MongoDB (Mongoose ODM)                           │    │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐   │    │
│  │  │   User    │  │    Todo    │  │RefreshToken│  │  (Future)  │   │    │
│  │  │ Collection│  │ Collection │  │ Collection │  │            │   │    │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      CACHING LAYER                                  │    │
│  │  ┌──────────────────────┐  ┌────────────────────────────────────┐  │    │
│  │  │  Session Cache       │  │  Query Cache (with TTL)           │  │    │
│  │  │  (In-memory)         │  │  (User-specific queries)           │  │    │
│  │  └──────────────────────┘  └────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                                                             
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL SERVICES                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐      │
│  │   Google OAuth  │  │   SMTP/Email   │  │   Vercel/Render        │      │
│  │   (Auth Provider│  │   (Nodemailer) │  │   (Deployment)         │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3. Technology Stack

#### Backend Technologies
| Component | Technology | Version |
|-----------|------------|---------|
| Runtime | Bun/Node.js | 20.x |
| Framework | Express.js | 4.18.x |
| Language | TypeScript | 5.x |
| Database | MongoDB | 6.x+ |
| ODM | Mongoose | 8.x |
| Authentication | JWT + Refresh Tokens | - |
| Validation | Zod | 4.x |
| Security | bcryptjs | 2.4.x |
| Rate Limiting | express-rate-limit | 7.x |

#### Frontend Technologies
| Component | Technology | Version |
|-----------|------------|---------|
| Build Tool | Vite | 5.x |
| Framework | React | 18.x |
| Language | TypeScript | 5.x |
| Styling | TailwindCSS | 3.x |
| HTTP Client | Axios | 1.x |
| State Management | React Context + Hooks | - |
| PWA | Service Workers + Workbox | - |

### 4. Architectural Layers

#### 4.1 Client Layer (Frontend)
```
┌─────────────────────────────────────────────────────────────────┐
│                     React Application                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │    Pages    │    │  Components  │    │    Hooks     │      │
│  │              │    │              │    │              │      │
│  │ - Home      │    │ - AuthForm   │    │ - useAuth    │      │
│  │ - AdminDash │    │ - TodoList   │    │ - useTodo    │      │
│  │             │    │ - ThemeSel   │    │              │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Services  │    │    Theme     │    │    Utils     │      │
│  │              │    │              │    │              │      │
│  │ - api.ts    │    │ - ThemeCtx   │    │ - crypto    │      │
│  │ - offline   │    │ - themes.ts  │    │ - helpers   │      │
│  │ - onboarding│   │              │    │              │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.2 API Layer (Backend)
```
┌─────────────────────────────────────────────────────────────────┐
│                     Express Application                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Middleware Stack                       │   │
│  │                                                           │   │
│  │  [CORS] → [Compression] → [Rate Limit] → [Cookie Parse] │   │
│  │                                       → [JSON Parse]      │   │
│  │                                       → [DB Connect]     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Controllers                            │   │
│  │                                                           │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐          │   │
│  │  │   Auth    │  │    Todo    │  │   Admin   │          │   │
│  │  │ Controller│  │ Controller │  │ Controller│          │   │
│  │  └────────────┘  └────────────┘  └────────────┘          │   │
│  │                                                           │   │
│  │  ┌────────────┐  ┌────────────┐                         │   │
│  │  │  Google   │  │   Email    │                         │   │
│  │  │  Auth     │  │   Check    │                         │   │
│  │  └────────────┘  └────────────┘                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Utilities                              │   │
│  │                                                           │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │   │
│  │  │Database  │ │ Session  │ │ Security │ │  Logger │    │   │
│  │  │          │ │  Cache   │ │          │ │          │    │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.3 Data Layer
```
┌─────────────────────────────────────────────────────────────────┐
│                      MongoDB Collections                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │      User       │    │      Todo        │                     │
│  ├─────────────────┤    ├─────────────────┤                     │
│  │ _id             │    │ _id             │                     │
│  │ email *         │    │ text *          │                     │
│  │ password        │    │ completed       │                     │
│  │ displayName    │    │ user (ref) *    │                     │
│  │ role           │    │ category        │                     │
│  │ authProvider   │    │ priority        │                     │
│  │ isGoogleUser   │    │ tags []         │                     │
│  │ googleId       │    │ dueDate         │                     │
│  │ encryptionSalt │    │ order           │                     │
│  │ emailVerified  │    │ participants [] │                     │
│  │ hasCompletedOn │    │ createdAt       │                     │
│  │   boarding     │    │ updatedAt       │                     │
│  │ quickStartProg │    └─────────────────┘                     │
│  │ emailDripSched │                                               │
│  │ createdAt      │    ┌─────────────────┐                     │
│  │ updatedAt      │    │  RefreshToken    │                     │
│  └─────────────────┘    ├─────────────────┤                     │
│                         │ _id             │                     │
│                         │ user (ref) *    │                     │
│                         │ token *         │                     │
│                         │ device          │                     │
│                         │ expiresAt       │                     │
│                         │ revoked         │                     │
│                         └─────────────────┘                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5. Security Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SECURITY LAYERS                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    TRANSPORT SECURITY                         │ │
│  │  - HTTPS enforced in production                                │ │
│  │  - Secure cookies (httpOnly, secure, sameSite)                │ │
│  │  - CORS with whitelist                                        │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                              │                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    AUTHENTICATION                             │ │
│  │  - JWT access tokens (15 min expiry)                          │ │
│  │  - Refresh tokens with rotation (30 days)                    │ │
│  │  - Google OAuth 2.0                                           │ │
│  │  - Account lockout after 5 failed attempts                   │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                              │                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    AUTHORIZATION                              │ │
│  │  - Role-based access control (user/admin)                    │ │
│  │  - Resource ownership validation                              │ │
│  │  - Admin middleware protection                                │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                              │                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    DATA SECURITY                              │ │
│  │  - Client-side AES encryption with user password             │ │
│  │  - Password hashing (bcrypt, 10 rounds)                      │ │
│  │  - Input validation (Zod schemas)                             │ │
│  │  - XSS protection (xss library)                               │ │
│  │  - SQL injection prevention (Mongoose parameterized)        │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 6. Deployment Architecture

#### Production Deployment
```
┌────────────────────────────────────────────────────────────────────────┐
│                         PRODUCTION DEPLOYMENT                          │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                    CDN (Vercel Edge Network)                    │  │
│   │                                                                   │  │
│   │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │  │
│   │  │   Static     │    │   Serverless │    │    API       │       │  │
│   │  │   Assets    │    │   Functions  │    │   Functions │       │  │
│   │  │  (React)    │    │   (Auth)     │    │   (Routes)  │       │  │
│   │  └──────────────┘    └──────────────┘    └──────────────┘       │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                    │                                    │
│                                    ▼                                    │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                      MongoDB Atlas                               │  │
│   │                 (Managed Database Cluster)                      │  │
│   │                                                                   │  │
│   │  ┌─────────┐   ┌─────────┐   ┌─────────┐                       │  │
│   │  │ Primary │──▶│Replica 1│──▶│Replica 2│                       │  │
│   │  │  Node   │   │  Node   │   │  Node   │                       │  │
│   │  └─────────┘   └─────────┘   └─────────┘                       │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                    EXTERNAL SERVICES                            │  │
│   │                                                                   │  │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │  │
│   │  │ Google OAuth │  │ SendGrid/    │  │  DNS        │          │  │
│   │  │              │  │  SMTP        │  │  Provider   │          │  │
│   │  └──────────────┘  └──────────────┘  └──────────────┘          │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### 7. Scalability Considerations

| Component | Current | Scaling Strategy |
|-----------|---------|------------------|
| Database | Single cluster | Read replicas, sharding |
| Cache | In-memory | Redis cluster |
| Session | In-memory | Redis sessions |
| Static Assets | Vercel CDN | Edge caching |
| API | Serverless | Auto-scaling |
| Auth | Stateless JWT | Horizontal scaling |

### 8. Data Flow Diagrams

#### Authentication Flow
```
User Login Flow:
───────────────
  1. User submits credentials
         │
         ▼
  2. API validates credentials
         │
         ▼
  3. Generate JWT (15 min) + Refresh Token (30 days)
         │
         ▼
  4. Set httpOnly cookies (auth_token, refresh_token)
         │
         ▼
  5. Cache user session in memory
         │
         ▼
  6. Return user data + encryption salt

Token Refresh Flow:
──────────────────
  1. Access token expires
         │
         ▼
  2. Client receives 401
         │
         ▼
  3. Call /api/auth/refresh with refresh_token
         │
         ▼
  4. Validate refresh token + rotate
         │
         ▼
  5. Generate new access token
         │
         ▼
  6. Return new access token
```

#### Todo Operations Flow
```
Create Todo:
────────────
  1. User submits todo text (plaintext)
         │
         ▼
  2. Frontend encrypts with user password + salt
         │
         ▼
  3. POST /api/todos (encrypted text in body)
         │
         ▼
  4. Auth middleware validates JWT
         │
         ▼
  5. Todo controller validates + sanitizes
         │
         ▼
  6. Save to MongoDB (encrypted)
         │
         ▼
  7. Invalidate query cache
         │
         ▼
  8. Return created todo

Get Todos:
──────────
  1. GET /api/todos
         │
         ▼
  2. Auth middleware validates JWT
         │
         ▼
  3. Check query cache (3s TTL)
         │
         ├── Cache Hit ──▶ Return cached data
         │
         └── Cache Miss ──▶ Query MongoDB
                                   │
                                   ▼
                              Cache result (3s)
                                   │
                                   ▼
                              Return todos
```

### 9. Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Client-side encryption | Users control their data; server never sees plaintext |
| JWT + Refresh Tokens | Stateless auth with automatic token rotation |
| MongoDB with Mongoose | Flexible schema, document storage fits todo model |
| In-memory session cache | Fast auth checks without DB round-trip |
| Query cache with TTL | Reduce MongoDB load for frequent queries |
| Serverless deployment | Auto-scale, pay only for usage |
| Cookie-based sessions | More secure than localStorage |
| Rate limiting | Prevent brute-force and DoS attacks |

### 10. Future Architectural Improvements

1. **Redis Integration**: Replace in-memory cache with Redis for distributed caching
2. **WebSocket Support**: Real-time todo updates across devices
3. **Microservices**: Split into auth, todo, and admin services
4. **GraphQL API**: Flexible querying for complex frontends
5. **CDN for API**: Edge caching for public endpoints

---

*Document Version: 1.0*
*Last Updated: Auto-generated from codebase analysis*

