# System Design Document

## Todo Application - Comprehensive System Design

### Table of Contents
1. [System Overview](#1-system-overview)
2. [Infrastructure Design](#2-infrastructure-design)
3. [Data Design](#3-data-design)
4. [API Design](#4-api-design)
5. [Security Design](#5-security-design)
6. [Performance Design](#6-performance-design)
7. [Reliability & Availability](#7-reliability--availability)
8. [Disaster Recovery](#8-disaster-recovery)
9. [Monitoring & Observability](#9-monitoring--observability)
10. [CI/CD Pipeline](#10-cicd-pipeline)

---

### 1. System Overview

The Todo Application is a full-stack task management system designed with security, scalability, and user experience as core principles.

#### 1.1 System Boundaries
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SYSTEM BOUNDARIES                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        TODO APP SYSTEM                                │   │
│   │                                                                       │   │
│   │   ┌───────────────┐     ┌───────────────┐     ┌───────────────┐    │   │
│   │   │   Frontend   │────▶│     API      │────▶│   Database   │    │   │
│   │   │   (React)    │◀────│   (Express)  │◀────│  (MongoDB)    │    │   │
│   │   └───────────────┘     └───────────────┘     └───────────────┘    │   │
│   │         │                     │                     │               │   │
│   │         │                     │                     │               │   │
│   │         ▼                     ▼                     ▼               │   │
│   │   ┌───────────────┐     ┌───────────────┐     ┌───────────────┐    │   │
│   │   │  Browser      │     │   External    │     │     DNS       │    │   │
│   │   │  Storage      │     │   Services    │     │   Provider    │    │   │
│   │   │  (IndexedDB) │     │   (Google,    │     │               │    │   │
│   │   │               │     │    SMTP)      │     │               │    │   │
│   │   └───────────────┘     └───────────────┘     └───────────────┘    │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   EXTERNAL SYSTEMS:                                                         │
│   ├── Google OAuth - Authentication provider                                │
│   ├── SendGrid/SMTP - Email delivery                                        │
│   ├── Vercel - Frontend hosting & CDN                                       │
│   └── MongoDB Atlas - Database hosting                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 1.2 Core Features
- **Todo Management**: Create, read, update, delete, reorder tasks
- **Categories & Priorities**: Organize todos with categories and priorities
- **Client-Side Encryption**: End-to-end encryption using user's password
- **Multi-Device Sync**: Web access with offline support
- **Authentication**: Email/password + Google OAuth
- **Admin Dashboard**: User and content management
- **Email Automation**: Welcome sequences and reminders

---

### 2. Infrastructure Design

#### 2.1 Current Architecture
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PRODUCTION INFRASTRUCTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                         INTERNET                                    │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                          │
│                                    ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                    CDN / EDGE NETWORK (VERCEL)                     │    │
│   │                                                                      │    │
│   │   ┌──────────────────┐    ┌──────────────────┐                     │    │
│   │   │   Static Files   │    │  Serverless     │                     │    │
│   │   │   (React App)    │    │  API Functions  │                     │    │
│   │   │                  │    │                  │                     │    │
│   │   │  - HTML/JS/CSS  │    │  - /api/auth/*  │                     │    │
│   │   │  - Images        │    │  - /api/todos/* │                     │    │
│   │   │  - PWA Assets   │    │  - /api/admin/* │                     │    │
│   │   └──────────────────┘    └──────────────────┘                     │    │
│   │                                                                      │    │
│   │   Cache: Cloudflare Edge                                             │    │
│   │   SSL: Auto-provisioned                                             │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                          │
│                         HTTPS (TLS 1.3)                                      │
│                                    ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                       APPLICATION LAYER                              │    │
│   │                                                                      │    │
│   │   ┌──────────────────────────────────────────────────────────────┐  │    │
│   │   │                   Express.js Middleware                      │  │    │
│   │   │                                                               │  │    │
│   │   │   [CORS] → [Rate Limit] → [Auth] → [Validation] → [Route]  │  │    │
│   │   └──────────────────────────────────────────────────────────────┘  │    │
│   │                                    │                                  │    │
│   │                                    ▼                                  │    │
│   │   ┌──────────────────────────────────────────────────────────────┐  │    │
│   │   │                     Controllers                                │  │    │
│   │   │                                                               │  │    │
│   │   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │  │    │
│   │   │   │    Auth    │  │    Todo    │  │   Admin    │           │  │    │
│   │   │   │ Controller │  │ Controller │  │ Controller │           │  │    │
│   │   │   └─────────────┘  └─────────────┘  └─────────────┘           │  │    │
│   │   └──────────────────────────────────────────────────────────────┘  │    │
│   │                                                                      │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                          │
│                         Internal Network                                      │
│                                    ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                       DATA LAYER                                     │    │
│   │                                                                      │    │
│   │   ┌────────────────────────┐  ┌────────────────────────┐          │    │
│   │   │    MongoDB Atlas       │  │    In-Memory Cache    │          │    │
│   │   │    (Primary DB)        │  │    (Session Cache)    │          │    │
│   │   │                        │  │                        │          │    │
│   │   │  ┌─────────────────┐  │  │  ┌─────────────────┐  │          │    │
│   │   │  │   Replica Set  │  │  │  │  Node.js        │  │          │    │
│   │   │  │                │  │  │  │  Memory         │  │          │    │
│   │   │  │  Primary       │  │  │  │                 │  │          │    │
│   │   │  │  Secondary 1  │  │  │  │  - User Cache   │  │          │    │
│   │   │  │  Secondary 2  │  │  │  │  - Query Cache │  │          │    │
│   │   │  └─────────────────┘  │  │  └─────────────────┘  │          │    │
│   │   └────────────────────────┘  └────────────────────────┘          │    │
│   │                                                                      │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                    EXTERNAL SERVICES                                  │    │
│   │                                                                      │    │
│   │   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐           │    │
│   │   │   Google    │   │    SMTP      │   │   External   │           │    │
│   │   │   OAuth     │   │   (Email)    │   │   Logging   │           │    │
│   │   └──────────────┘   └──────────────┘   └──────────────┘           │    │
│   │                                                                      │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 2.2 Network Configuration

| Component | Protocol | Port | Security |
|-----------|----------|------|----------|
| Frontend → API | HTTPS | 443 | TLS 1.3 |
| API → MongoDB | mongodb+srv | 27017 | TLS |
| API → SMTP | SMTPS/STARTTLS | 587 | TLS |
| API → Google OAuth | HTTPS | 443 | TLS 1.3 |

#### 2.3 Environment Configuration

| Environment | URL | Database | Features |
|-------------|-----|----------|----------|
| Development | localhost:5173 | Local MongoDB | Debug logging, hot reload |
| Staging | staging.*.vercel.app | Atlas Staging | Full features, test data |
| Production | metb-todo.vercel.app | Atlas Production | Optimized, monitoring |

---

### 3. Data Design

#### 3.1 Database Schema

##### User Collection
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            USER COLLECTION                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   _id : ObjectId                                                            │
│   ├── Indexed: Primary Key                                                  │
│   ├── Type: Mongoose ObjectId                                              │
│   └── Generation: Auto-increment                                           │
│                                                                             │
│   email : String                                                            │
│   ├── Required: Yes                                                         │
│   ├── Unique: Yes                                                          │
│   ├── Indexed: Yes (asc)                                                   │
│   ├── Validation: Email format                                             │
│   └── Purpose: Login identifier                                           │
│                                                                             │
│   password : String                                                         │
│   ├── Required: No (null for Google users)                                 │
│   ├── Hashed: bcrypt (10 rounds)                                          │
│   └── Purpose: Local authentication                                        │
│                                                                             │
│   displayName : String                                                     │
│   ├── Required: No                                                          │
│   ├── Default: "User"                                                      │
│   ├── Indexed: Yes                                                         │
│   └── Purpose: User's readable name                                        │
│                                                                             │
│   role : String                                                            │
│   ├── Enum: ['user', 'admin']                                             │
│   ├── Default: 'user'                                                      │
│   ├── Indexed: Yes                                                         │
│   └── Purpose: Authorization                                               │
│                                                                             │
│   authProvider : String                                                     │
│   ├── Enum: ['local', 'google']                                           │
│   ├── Default: 'local'                                                    │
│   └── Purpose: Track auth method                                           │
│                                                                             │
│   encryptionSalt : String                                                   │
│   ├── Required: Yes                                                        │
│   ├── Generated: crypto.randomBytes(16)                                    │
│   └── Purpose: Client-side AES encryption                                 │
│                                                                             │
│   [Additional security fields...]                                          │
│   ├── emailVerified, emailVerificationToken                               │
│   ├── passwordResetToken, passwordResetExpires                            │
│   ├── failedLoginAttempts, accountLockedUntil                             │
│   └── lastLoginAt                                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

##### Todo Collection
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TODO COLLECTION                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   _id : ObjectId                                                            │
│                                                                             │
│   text : String                                                            │
│   ├── Required: Yes                                                        │
│   ├── Max Length: 500                                                      │
│   ├── Encrypted: AES-256-GCM (client-side)                                │
│   └── Indexed: Text search                                                 │
│                                                                             │
│   user : ObjectId (ref: User)                                              │
│   ├── Required: Yes                                                        │
│   ├── Indexed: Yes                                                         │
│   └── Purpose: Ownership                                                   │
│                                                                             │
│   category : String                                                        │
│   ├── Enum: ['work', 'personal', 'shopping', 'health', 'other']         │
│   ├── Default: 'other'                                                    │
│   ├── Indexed: Yes                                                         │
│   └── Purpose: Organization                                               │
│                                                                             │
│   priority : String                                                         │
│   ├── Enum: ['low', 'medium', 'high']                                     │
│   ├── Default: 'medium'                                                   │
│   ├── Indexed: Yes                                                         │
│   └── Purpose: Sorting/filtering                                           │
│                                                                             │
│   order : Number                                                            │
│   ├── Required: Yes                                                        │
│   ├── Default: 0                                                           │
│   ├── Indexed: Yes                                                         │
│   └── Purpose: Manual ordering (drag-drop)                                │
│                                                                             │
│   [Additional fields...]                                                   │
│   ├── tags: Array<String>                                                 │
│   ├── dueDate: Date                                                        │
│   ├── participants: Array                                                  │
│   ├── completed: Boolean                                                   │
│   └── timestamps: createdAt, updatedAt                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 3.2 Data Relationships

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DATA RELATIONSHIPS                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                         ┌─────────────┐                                     │
│                         │    User     │                                     │
│                         └──────┬──────┘                                     │
│                                │                                            │
│                     1:N        │        N:1                                 │
│                                ▼                                            │
│                         ┌─────────────┐                                     │
│                         │    Todo     │◀────────────────┐                  │
│                         └─────────────┘                 │                  │
│                                │                    1:N                     │
│                                │                    │                       │
│                                ▼                    │                       │
│                         ┌─────────────┐             │                       │
│                         │RefreshToken │──────────────┘                      │
│                         └─────────────┘                                     │
│                                                                             │
│   RELATIONSHIP SUMMARY:                                                     │
│   ┌─────────────────┬──────────────┬─────────────────────────────────┐     │
│   │ Parent          │ Child         │ Type                            │     │
│   ├─────────────────┼──────────────┼─────────────────────────────────┤     │
│   │ User            │ Todo         │ One-to-Many (1:N)               │     │
│   │ User            │ RefreshToken │ One-to-Many (1:N)               │     │
│   │ Todo            │ Tag          │ One-to-Many (Embedded)          │     │
│   │ Todo            │ Participant  │ One-to-Many (Embedded)          │     │
│   └─────────────────┴──────────────┴─────────────────────────────────┘     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 4. API Design

#### 4.1 API Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          API ARCHITECTURE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                        API ENDPOINTS                                │  │
│   ├─────────────────────────────────────────────────────────────────────┤  │
│   │                                                                      │  │
│   │  ┌─────────────────────────────────────────────────────────────┐   │  │
│   │  │                    PUBLIC ENDPOINTS                          │   │  │
│   │  │                                                              │   │  │
│   │  │  GET    /health                              → Health    │   │  │
│   │  │  GET    /verify-email                       → Email Ver  │   │  │
│   │  │  GET    /reset-password                      → Password  │   │  │
│   │  │  GET    /api/auth/google/url                 → Google    │   │  │
│   │  │  GET    /api/auth/google/callback            → Google    │   │  │
│   │  │  GET    /api/auth/check-email                → Validation│   │  │
│   │  │                                                              │   │  │
│   │  └─────────────────────────────────────────────────────────────┘   │  │
│   │                                                                      │  │
│   │  ┌─────────────────────────────────────────────────────────────┐   │  │
│   │  │                 AUTHENTICATED ENDPOINTS                      │   │  │
│   │  │                                                              │   │  │
│   │  │  POST   /api/auth/register                   → Register  │   │  │
│   │  │  POST   /api/auth/login                      → Login     │   │  │
│   │  │  POST   /api/auth/logout                     → Logout    │   │  │
│   │  │  POST   /api/auth/refresh                    → Token     │   │  │
│   │  │  POST   /api/auth/verify-email               → Verify    │   │  │
│   │  │  POST   /api/auth/request-password-reset      → Reset    │   │  │
│   │  │  POST   /api/auth/reset-password             → Reset     │   │  │
│   │  │  POST   /api/auth/google/link                → Link     │   │  │
│   │  │  POST   /api/auth/google/unlink              → Unlink   │   │  │
│   │  │  GET    /api/auth/google/status              → Status    │   │  │
│   │  │  GET    /api/me                              → Profile   │   │  │
│   │  │  GET    /api/profile                         → Profile   │   │  │
│   │  │  PUT    /api/profile                         → Profile   │   │  │
│   │  │  DELETE /api/profile                         → Delete   │   │  │
│   │  │  GET    /api/todos                           → List     │   │  │
│   │  │  POST   /api/todos                           → Create   │   │  │
│   │  │  PUT    /api/todos/:id                       → Update   │   │  │
│   │  │  DELETE /api/todos/:id                       → Delete   │   │  │
│   │  │  POST   /api/todos/reorder                    → Reorder  │   │  │
│   │  │  GET    /api/onboarding/status               → Onboard  │   │  │
│   │  │  POST   /api/onboarding/complete             → Onboard  │   │  │
│   │  │                                                              │   │  │
│   │  └─────────────────────────────────────────────────────────────┘   │  │
│   │                                                                      │  │
│   │  ┌─────────────────────────────────────────────────────────────┐   │  │
│   │  │                   ADMIN ENDPOINTS                            │   │  │
│   │  │                                                              │   │  │
│   │  │  GET    /api/admin/dashboard                 → Dashboard │   │  │
│   │  │  GET    /api/admin/users                     → List       │   │  │
│   │  │  GET    /api/admin/users/:userId             → Details    │   │  │
│   │  │  PUT    /api/admin/users/:userId             → Update     │   │  │
│   │  │  DELETE /api/admin/users/:userId             → Delete     │   │  │
│   │  │  GET    /api/admin/todos                     → List       │   │  │
│   │  │  DELETE /api/admin/todos/:todoId              → Delete     │   │  │
│   │  │  POST   /api/admin/todos/delete-many          → Bulk Del  │   │  │
│   │  │  GET    /api/admin/health                     → Health    │   │  │
│   │  │                                                              │   │  │
│   │  └─────────────────────────────────────────────────────────────┘   │  │
│   │                                                                      │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 4.2 Authentication Flow
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       AUTHENTICATION FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────────────────────────────────────────────────────────────┐ │
│   │                      LOGIN FLOW                                       │ │
│   │                                                                       │ │
│   │    ┌─────────┐      ┌─────────────┐      ┌──────────────┐        │ │
│   │    │  User   │      │   Frontend   │      │     API      │        │ │
│   │    └────┬────┘      └──────┬───────┘      └──────┬───────┘        │ │
│   │         │                  │                     │                  │ │
│   │         │ 1. Enter creds   │                     │                  │ │
│   │         │─────────────────▶│                     │                  │ │
│   │         │                  │ 2. POST /login      │                  │ │
│   │         │                  │────────────────────▶│                  │ │
│   │         │                  │                     │                  │ │
│   │         │                  │                     │ 3. Validate     │ │
│   │         │                  │                     │    credentials  │ │
│   │         │                  │                     │         │        │ │
│   │         │                  │                     │         ▼        │ │
│   │         │                  │                     │ 4. Verify       │ │
│   │         │                  │                     │    password     │ │
│   │         │                  │                     │         │        │ │
│   │         │                  │                     │         ▼        │ │
│   │         │                  │                     │ 5. Generate     │ │
│   │         │                  │                     │    tokens        │ │
│   │         │                  │                     │         │        │ │
│   │         │                  │                     │         ▼        │ │
│   │         │                  │    6. Set cookies  │                  │ │
│   │         │                  │◀────────────────────│                  │ │
│   │         │                  │                     │                  │ │
│   │         │ 7. Redirect/     │                     │                  │ │
│   │         │    show app      │                     │                  │ │
│   │         │◀─────────────────│                     │                  │ │
│   │         │                  │                     │                  │ │
│   └─────────┴──────────────────┴─────────────────────┴──────────────────┘ │
│                                                                             │
│   COOKIE SET:                                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │ auth_token: HttpOnly, Secure, SameSite=None    (15 min)            │  │
│   │ refresh_token: HttpOnly, Secure, SameSite=None (30 days)           │  │
│   │ enc_salt: HttpOnly, Secure, SameSite=None    (7 days)             │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 5. Security Design

#### 5.1 Security Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SECURITY LAYERS                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                     LAYER 1: NETWORK SECURITY                       │  │
│   │                                                                      │  │
│   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │  │
│   │   │    TLS      │  │     CORS    │  │   WAF       │              │  │
│   │   │   1.3      │  │  Whitelist   │  │  Protection │              │  │
│   │   │   Only     │  │   Origins   │  │             │              │  │
│   │   └─────────────┘  └─────────────┘  └─────────────┘              │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                              │                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                   LAYER 2: AUTHENTICATION                            │  │
│   │                                                                      │  │
│   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │  │
│   │   │   JWT      │  │   Refresh   │  │   Google   │              │  │
│   │   │  15 min    │  │   Token     │  │   OAuth    │              │  │
│   │   │            │  │   Rotation  │  │    2.0     │              │  │
│   │   └─────────────┘  └─────────────┘  └─────────────┘              │  │
│   │                                                                      │  │
│   │   ┌─────────────┐  ┌─────────────┐                                │  │
│   │   │  Account   │  │   Rate      │                                │  │
│   │   │  Lockout   │  │   Limiting  │                                │  │
│   │   │  5 attempts│  │   100/15min │                                │  │
│   │   └─────────────┘  └─────────────┘                                │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                              │                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                    LAYER 3: AUTHORIZATION                            │  │
│   │                                                                      │  │
│   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │  │
│   │   │    RBAC    │  │  Ownership  │  │   Admin    │              │  │
│   │   │  User/Admin │  │   Checks    │  │  Middleware │              │  │
│   │   │            │  │             │  │             │              │  │
│   │   └─────────────┘  └─────────────┘  └─────────────┘              │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                              │                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                    LAYER 4: DATA SECURITY                            │  │
│   │                                                                      │  │
│   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │  │
│   │   │  Client    │  │   bcrypt    │  │    Zod      │              │  │
│   │   │  Encryption│  │  hashing    │  │  Validation │              │  │
│   │   │  AES-256   │  │   (10 rnd)  │  │             │              │  │
│   │   └─────────────┘  └─────────────┘  └─────────────┘              │  │
│   │                                                                      │  │
│   │   ┌─────────────┐  ┌─────────────┐                                │  │
│   │   │    XSS     │  │  Parameter  │                                │  │
│   │   │ Protection │  │  Injection  │                                │  │
│   │   └─────────────┘  └─────────────┘                                │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 5.2 Encryption Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CLIENT-SIDE ENCRYPTION                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   REGISTRATION:                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                                                                       │  │
│   │   User Password ──▶ PBKDF2 (100k iterations) ──▶ Key              │  │
│   │         │                                                             │  │
│   │         │         ┌─────────────────────────────────┐              │  │
│   │         └────────▶│  Client-Side Encryption          │              │  │
│   │                   │                                  │              │  │
│   │   EncryptionKey  │  Plaintext ──▶ AES-256-GCM ──▶ │              │  │
│   │                   │                 │              │  Encrypted   │  │
│   │   RandomSalt     │◀───────────────▶│              │              │  │
│   │                   └─────────────────────────────────┘              │  │
│   │                                                                       │  │
│   │   Server receives: encrypted text, salt                             │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│   LOGIN:                                                                   │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                                                                       │  │
│   │   1. Server returns encryptionSalt in response                      │  │
│   │   2. Browser derives key: PBKDF2(password + salt)                  │  │
│   │   3. Todos are stored encrypted in DB                               │  │
│   │   4. On read: Fetch encrypted → Decrypt with key → Display         │  │
│   │                                                                       │  │
│   │   KEY IS NEVER SENT TO SERVER                                       │  │
│   │                                                                       │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 6. Performance Design

#### 6.1 Performance Optimizations

| Layer | Optimization | Impact |
|-------|-------------|--------|
| Database | Compound indexes | 10x faster queries |
| Database | Query caching (3s TTL) | 50x faster reads |
| Database | Lean queries | 30% memory reduction |
| Database | Connection pooling | 5x throughput |
| API | Compression (gzip) | 70% bandwidth reduction |
| API | In-memory session cache | 100x faster auth |
| API | Rate limiting | DoS prevention |
| Frontend | Code splitting | 40% faster initial load |
| Frontend | PWA caching | Offline support |
| CDN | Static asset caching | 90% faster loads |

#### 6.2 Caching Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CACHING STRATEGY                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐ │
│   │                      CACHE TIERS                                      │ │
│   │                                                                      │ │
│   │   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐           │ │
│   │   │   L1       │     │    L2       │     │    L3       │           │ │
│   │   │  Browser   │     │   Server    │     │  Database   │           │ │
│   │   │  Memory    │     │   Memory    │     │   Cache     │           │ │
│   │   │            │     │             │     │             │           │ │
│   │   │  - Router │     │  - Session  │     │  - MongoDB  │           │ │
│   │   │  - State  │     │  - Query    │     │    Query    │           │ │
│   │   │            │     │    Cache    │     │    Cache    │           │ │
│   │   └─────┬──────┘     └──────┬──────┘     └──────┬──────┘           │ │
│   │         │                   │                   │                    │ │
│   │    │    │                   │                   │                    │ │
│   │    ▼    ▼                   ▼                   ▼                    │ │
│   │  Immediate  │    Seconds (3s)  │    Minutes     │                    │ │
│   │                                                                      │ │
│   │   TTL:     │    TTL:           │    TTL:       │                    │ │
│   │   - N/A    │    - Session: 5m  │    - Index    │                    │ │
│   │            │    - Query: 3s    │     : Config  │                    │ │
│   │            │                   │               │                    │ │
│   └────────────┴───────────────────┴───────────────┴────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 7. Reliability & Availability

#### 7.1 High Availability Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      HIGH AVAILABILITY                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   GOALS:                                                                    │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │   Availability Target: 99.9%                                        │  │
│   │   - Downtime allowed: 8.76 hours/year                              │  │
│   │   - Max daily downtime: 1.44 minutes                               │  │
│   │                                                                      │  │
│   │   Recovery Time Objective (RTO): 15 minutes                        │  │
│   │   Recovery Point Objective (RPO): 1 minute                        │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│   REDUNDANCY:                                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │   Database:                                                          │  │
│   │   - MongoDB Atlas Replica Set (3 nodes)                            │  │
│   │   - Automatic failover                                              │  │
│   │   - Daily backups                                                   │  │
│   │                                                                      │  │
│   │   Application:                                                      │  │
│   │   - Serverless (Vercel) - Auto-scaling                            │  │
│   │   - Multiple edge locations                                        │  │
│   │   - Zero cold start (warm pools)                                  │  │
│   │                                                                      │  │
│   │   CDN:                                                              │  │
│   │   - Global edge network                                            │  │
│   │   - Automatic failover                                              │  │
│   │   - DDoS protection                                                 │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│   FAILURE SCENARIOS:                                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │   Database Failure:                                                 │  │
│   │   - Detect: Health check every 30s                                  │  │
│   │   - Response: Return 503, retry with backoff                        │  │
│   │   - Recovery: Auto-failover, max 30s                                │  │
│   │                                                                      │  │
│   │   Auth Token Expiry:                                                │  │
│   │   - Detect: 401 response                                            │  │
│   │   - Response: Auto-refresh, retry request                           │  │
│   │   - Recovery: Immediate                                             │  │
│   │                                                                      │  │
│   │   Rate Limit Exceeded:                                              │  │
│   │   - Detect: 429 response                                            │  │
│   │   - Response: Show message, auto-retry after wait                  │  │
│   │   - Recovery: Immediate after cooldown                              │  │
│   │                                                                      │  │
│   │   Network Offline:                                                  │  │
│   │   - Detect: Navigator.onLine                                        │  │
│   │   - Response: Queue operations, sync when online                    │  │
│   │   - Recovery: Immediate on reconnect                                │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 8. Disaster Recovery

#### 8.1 Backup & Recovery

| Data Type | Backup Frequency | Retention | Recovery Method |
|-----------|----------------|-----------|-----------------|
| Database | Daily + Continuous | 30 days | Atlas Restore |
| Config Files | On change | Forever | Git/Version Control |
| User Uploads | N/A | N/A | N/A |
| Secrets | N/A | N/A | Environment |

---

### 9. Monitoring & Observability

#### 9.1 Monitoring Stack

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       MONITORING & LOGGING                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   METRICS:                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │   Application Metrics:                                              │  │
│   │   - Request rate (RPM)                                              │  │
│   │   - Response time (p50, p95, p99)                                  │  │
│   │   - Error rate (%)                                                  │  │
│   │   - Active users                                                    │  │
│   │   - API utilization                                                 │  │
│   │                                                                      │  │
│   │   Database Metrics:                                                 │  │
│   │   - Connection count                                                │  │
│   │   - Query latency                                                   │  │
│   │   - Memory usage                                                   │  │
│   │   - Replication lag                                                │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│   LOGGING:                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │   Log Levels:                                                       │  │
│   │   - ERROR: Server errors, exceptions                               │  │
│   │   - WARN: Deprecations, retries                                   │  │
│   │   - INFO: Auth events, admin actions                              │  │
│   │   - DEBUG: Detailed flow (dev only)                                │  │
│   │                                                                      │  │
│   │   Log Storage:                                                      │  │
│   │   - Vercel Function Logs                                          │  │
│   │   - MongoDB Atlas Logs                                            │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│   ALERTING:                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │   Alert Conditions:                                                 │  │
│   │   - Error rate > 5% for 5 minutes                                  │  │
│   │   - Response time p95 > 2s for 5 minutes                          │  │
│   │   - Database connections > 80%                                    │  │
│   │   - Failed login attempts > 20/min                                │  │
│   │                                                                      │  │
│   │   Notification:                                                    │  │
│   │   - Email to admin                                                 │  │
│   │   - Dashboard status indicators                                    │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 10. CI/CD Pipeline

#### 10.1 Deployment Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CI/CD PIPELINE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                      DEVELOPER COMMITS                              │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                          │
│                                    ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                         CI STAGE                                    │  │
│   │                                                                      │  │
│   │   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐           │  │
│   │   │   Lint     │    │   Type      │    │   Tests    │           │  │
│   │   │   Check    │───▶│   Check     │───▶│   Run      │           │  │
│   │   │            │    │             │    │             │           │  │
│   │   │  ESLint   │    │  TypeScript │    │   Vitest   │           │  │
│   │   │            │    │  tsc        │    │   Bun      │           │  │
│   │   └─────────────┘    └─────────────┘    └─────────────┘           │  │
│   │            │                  │                  │                   │  │
│   │            └──────────────────┼──────────────────┘                   │  │
│   │                               ▼                                      │  │
│   │                    ┌─────────────────┐                               │  │
│   │                    │   Build Check  │                               │  │
│   │                    │                 │                               │  │
│   │                    │  Vite Build    │                               │  │
│   │                    │  Bun Build     │                               │  │
│   │                    └─────────────────┘                               │  │
│   │                                                                      │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                          │
│                                    ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                         CD STAGE                                    │  │
│   │                                                                      │  │
│   │   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐           │  │
│   │   │  Deploy to  │    │   Smoke     │    │   Deploy   │           │  │
│   │   │  Staging    │───▶│   Tests     │───▶│   Production│           │  │
│   │   │             │    │             │    │             │           │  │
│   │   │  Vercel    │    │  API Tests  │    │  Vercel    │           │  │
│   │   │  Preview   │    │  UI Tests   │    │  Production│           │  │
│   │   └─────────────┘    └─────────────┘    └─────────────┘           │  │
│   │                                                                      │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                          │
│                                    ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                     POST-DEPLOYMENT                                │  │
│   │                                                                      │  │
│   │   - Health check verification                                      │  │
│   │   - Cache warm-up                                                  │  │
│   │   - Slack notification                                            │  │
│   │                                                                      │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 11. Appendix

#### 11.1 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| MONGODB_URI | Database connection string | Yes | - |
| JWT_SECRET | JWT signing secret | Yes | - |
| JWT_REFRESH_SECRET | Refresh token secret | Yes | - |
| GOOGLE_CLIENT_ID | Google OAuth client ID | Yes | - |
| GOOGLE_CLIENT_SECRET | Google OAuth client secret | Yes | - |
| SMTP_HOST | Email server host | Yes | - |
| SMTP_PORT | Email server port | Yes | 587 |
| SMTP_USER | Email authentication user | Yes | - |
| SMTP_PASS | Email authentication password | Yes | - |
| FRONTEND_URL | Frontend URL | Yes | http://localhost:5173 |
| ADMIN_EMAIL | Admin email for dashboard | No | - |
| NODE_ENV | Environment | No | development |

#### 11.2 API Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /api/auth/login | 10 | 15 minutes |
| POST /api/auth/register | 5 | 15 minutes |
| POST /api/auth/refresh | 30 | 15 minutes |
| POST /api/auth/request-password-reset | 3 | 15 minutes |
| All other API endpoints | 100 | 15 minutes |

---

*Document Version: 1.0*
*Last Updated: Auto-generated from codebase analysis*

