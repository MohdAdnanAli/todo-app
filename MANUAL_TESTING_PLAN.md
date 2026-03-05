# 🔍 Todo App - Complete Manual Testing Plan

> **Smart Testing Strategy**: Prioritize high-impact areas using risk-based testing, equivalence partitioning, and boundary value analysis. This plan covers the full stack with efficient test execution in mind.

---

## 📋 System Overview

### Architecture
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + PWA
- **Backend**: Express.js + MongoDB (Mongoose) + JWT
- **Authentication**: Email/Password + Google OAuth
- **Security**: Client-side AES-GCM encryption, bcrypt, rate limiting
- **Storage**: IndexedDB (offline) + MongoDB (server)

### Key Features to Test
1. User Authentication (Register, Login, Logout)
2. Google OAuth Integration
3. Todo CRUD Operations
4. Client-Side Encryption/Decryption
5. Drag-and-Drop Reordering
6. Categories, Priorities, Tags, Due Dates
7. Offline Mode & Sync Queue
8. Admin Dashboard
9. Profile Management
10. Password Reset & Email Verification
11. PWA Installation & Offline Support

---

## 🧪 Test Environment Setup

### Prerequisites
```bash
# Start backend
cd api && bun install && bun run dev

# Start frontend  
cd frontend && bun install && bun run dev

# Access points:
# Frontend: http://localhost:5173
# Backend API: http://localhost:5000
# Health Check: http://localhost:5000/health
```

### Test Accounts to Create
| Email | Password | Purpose |
|-------|----------|---------|
| testuser1@test.com | TestPass123! | Primary test user |
| testuser2@test.com | TestPass123! | Secondary user for sharing |
| admin@test.com | AdminPass123! | Admin dashboard testing |

### Browser Testing Matrix
| Browser | Version | Notes |
|---------|---------|-------|
| Chrome | Latest | Primary browser |
| Firefox | Latest | Cross-browser |
| Safari | Latest | Mac users |
| Mobile (iOS) | Latest | PWA testing |
| Mobile (Android) | Latest | PWA testing |

---

## 📝 Phase 1: Authentication Testing

### 1.1 User Registration

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| **TC-REG-01**: Valid Registration | 1. Enter valid email<br>2. Enter password meeting requirements<br>3. Enter display name<br>4. Click Register | Account created, encryption salt generated, redirected to app | P0 |
| **TC-REG-02**: Email Already Exists | 1. Register with existing email | Error: "Email already in use" | P0 |
| **TC-REG-03**: Weak Password | 1. Enter password < 8 chars | Error: "Password must be at least 8 characters" | P1 |
| **TC-REG-04**: Empty Display Name | 1. Leave display name empty | Error: "Display name is required" | P1 |
| **TC-REG-05**: Temporary Email Blocked | 1. Enter temp email (e.g., mailinator.com) | Error: "Temporary emails are not allowed" | P1 |
| **TC-REG-06**: SQL Injection Attempt | 1. Enter `' OR '1'='1` in fields | Input sanitized, no injection | P1 |
| **TC-REG-07**: XSS Attempt | 1. Enter `<script>alert('xss')</script>` as display name | Input sanitized, no script execution | P1 |
| **TC-REG-08**: Example Todos Created | 1. Register new account<br>2. Check todos | 3 example todos created automatically | P2 |

### 1.2 User Login

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| **TC-LOG-01**: Valid Login | 1. Enter correct email/password<br>2. Click Login | JWT cookie set, user data loaded, todos decrypted | P0 |
| **TC-LOG-02**: Invalid Password | 1. Enter correct email, wrong password | Error: "Invalid credentials" | P0 |
| **TC-LOG-03**: Non-Existent Email | 1. Enter unregistered email | Error: "Invalid credentials" | P0 |
| **TC-LOG-04**: Locked Account | 1. Attempt 5+ failed logins<br>2. Try to login | Error: "Account temporarily locked" | P1 |
| **TC-LOG-05**: Google Account Login | 1. Click Google login | Redirect to Google OAuth, then back | P0 |
| **TC-LOG-06**: Session Persistence | 1. Login, close browser<br>2. Reopen app | Auto-logged in via cookie | P0 |
| **TC-LOG-07**: Rate Limiting | 1. Attempt 100 rapid logins | Requests blocked after limit | P1 |

### 1.3 User Logout

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| **TC-LOGOUT-01**: Normal Logout | 1. Click Logout button | Cookie cleared, password cleared from storage, redirected to login | P0 |
| **TC-LOGOUT-02**: Logout from Admin | 1. Login as admin<br>2. Logout | Properly logged out, admin state cleared | P1 |

---

## 📝 Phase 2: Todo Management Testing

### 2.1 Create Todo

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| **TC-TODO-C-01**: Basic Todo | 1. Enter task text<br>2. Click Add | Todo created, appears at top of list | P0 |
| **TC-TODO-C-02**: Empty Text | 1. Click Add with empty field | Error: "Task text is required" | P0 |
| **TC-TODO-C-03**: Max Length Text | 1. Enter 500+ character text | Error or text truncated | P1 |
| **TC-TODO-C-04**: With Category | 1. Add todo with category=work | Category saved and displayed | P1 |
| **TC-TODO-C-05**: With Priority | 1. Add todo with priority=high | Priority saved and displayed | P1 |
| **TC-TODO-C-06**: With Tags | 1. Add todo with tags ["urgent", "review"] | Tags saved and displayed | P2 |
| **TC-TODO-C-07**: With Due Date | 1. Add todo with due date | Due date saved and displayed | P2 |
| **TC-TODO-C-08**: Encrypted Storage | 1. Add todo<br>2. Check DB/API response | Text is encrypted in storage | P0 |
| **TC-TODO-C-09**: Special Characters | 1. Add todo with emojis 😎🎉 | Encrypted/decrypted correctly | P1 |

### 2.2 Read/View Todos

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| **TC-TODO-R-01**: View All Todos | 1. Login with todos | All user's todos displayed | P0 |
| **TC-TODO-R-02**: Correct Decryption | 1. Login<br>2. Verify decrypted text | Original text visible (not encrypted) | P0 |
| **TC-TODO-R-03**: Empty List | 1. Login with no todos | "No tasks yet" message shown | P1 |
| **TC-TODO-R-04**: Sort Order | 1. Check todo order | Sorted by order field (drag/drop order) | P1 |

### 2.3 Update Todo

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| **TC-TODO-U-01**: Toggle Complete | 1. Click checkbox | Todo marked complete/incomplete | P0 |
| **TC-TODO-U-02**: Edit Text | 1. Click edit, modify text | Text updated, re-encrypted | P1 |
| **TC-TODO-U-03**: Change Category | 1. Change category | Category updated | P1 |
| **TC-TODO-U-04**: Change Priority | 1. Change priority | Priority updated | P1 |
| **TC-TODO-U-05**: Update Due Date | 1. Set/modify due date | Due date updated | P2 |
| **TC-TODO-U-06**: Ownership Check | 1. Try to update another user's todo | Error or unauthorized | P1 |

### 2.4 Delete Todo

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| **TC-TODO-D-01**: Delete Single | 1. Click delete on todo | Todo removed, confirmation shown | P0 |
| **TC-TODO-D-02**: Confirm Dialog | 1. Click delete<br>2. Cancel | Todo NOT deleted | P1 |
| **TC-TODO-D-03**: Reorder After Delete | 1. Delete todo<br>2. Check order | Remaining todos reordered (no gaps) | P1 |
| **TC-TODO-D-04**: Delete from Admin | 1. Admin deletes user's todo | Todo deleted, user sees update | P1 |

### 2.5 Drag-and-Drop Reordering

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| **TC-DND-01**: Reorder Todos | 1. Drag todo to new position | Order saved, persisted on reload | P0 |
| **TC-DND-02**: Multiple Reorders | 1. Perform 5+ reorders | All changes saved correctly | P1 |
| **TC-DND-03**: Sync Across Devices | 1. Reorder on desktop<br>2. Check on mobile | Order synced | P2 |

---

## 📝 Phase 3: Encryption & Security Testing

### 3.1 Client-Side Encryption

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| **TC-ENC-01**: Encryption on Create | 1. Add todo<br>2. Check API response | Text is encrypted (not plain text) | P0 |
| **TC-ENC-02**: Decryption on View | 1. Login and view todos | Original text decrypted and shown | P0 |
| **TC-ENC-03**: Wrong Password | 1. Clear stored password<br>2. Try to view todos | Encrypted text shown or error | P1 |
| **TC-ENC-04**: Logout Clears Password | 1. Logout<br>2. Check storage | Password removed from IndexedDB/localStorage | P1 |
| **TC-ENC-05**: Key Derivation | 1. Check crypto.ts | PBKDF2 with SHA-256 used | P1 |
| **TC-ENC-06**: AES-GCM Verification | 1. Check crypto.ts | AES-GCM 256-bit encryption used | P1 |

### 3.2 Security Tests

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| **TC-SEC-01**: JWT Token Validation | 1. Manipulate JWT cookie | Invalid/expired tokens rejected | P0 |
| **TC-SEC-02**: SQL Injection in Todos | 1. Add todo with `' DROP TABLE` | Text stored as-is, no injection | P1 |
| **TC-SEC-03**: XSS in Todo Text | 1. Add `<img src=x onerror=alert(1)>` | Script not executed | P1 |
| **TC-SEC-04**: CSRF Protection | 1. Check cookie settings | SameSite attribute set | P1 |
| **TC-SEC-05**: Rate Limiting | 1. Flood API requests | Requests throttled after limit | P1 |

---

## 📝 Phase 4: Offline & PWA Testing (Expanded)

> Based on the implementation analysis, the app uses:
> - **IndexedDB** via `idb` library with stores: `todos`, `syncQueue`, `metadata`
> - **Vite PWA** with Workbox for service worker and caching
> - **Runtime caching**: NetworkFirst for API, CacheFirst for fonts
> - **Offline storage** includes password and encryption salt for client-side encryption

### 4.1 Offline Storage (IndexedDB + Sync Queue)

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| **TC-OFF-01**: IndexedDB Storage | 1. Add todo<br>2. Open DevTools > Application > IndexedDB | Todo stored in TodoAppDB | P0 |
| **TC-OFF-02**: Offline Todo Creation | 1. DevTools > Network > Toggle Offline<br>2. Add todo | Todo saved to IndexedDB 'todos' store | P0 |
| **TC-OFF-03**: Sync Queue on Offline Create | 1. Go offline<br>2. Add todo<br>3. Check IndexedDB > syncQueue | Action queued with timestamp | P1 |
| **TC-OFF-04**: Sync Queue Processing | 1. Go offline, add todo<br>2. Go online (Network toggle) | Todo synced to server, queue cleared | P1 |
| **TC-OFF-05**: IndexedDB Fallback to localStorage | 1. Disable IndexedDB (if possible)<br>2. Add todo | Falls back to localStorage | P2 |
| **TC-OFF-06**: Password Persistence in IndexedDB | 1. Login<br>2. Check IndexedDB > metadata | Password stored encrypted | P1 |
| **TC-OFF-07**: Encryption Salt Persistence | 1. Login<br>2. Check IndexedDB > metadata > encryption-salt | Salt saved correctly | P1 |
| **TC-OFF-08**: Multiple Offline Operations | 1. Go offline<br>2. Create 5 todos<br>3. Delete 2 todos<br>4. Go online | All operations sync in order | P1 |
| **TC-OFF-09**: Stale Data Cleanup | 1. Add todo offline<br>2. Wait 24+ hours<br>3. Go online | Old sync queue items handled | P2 |
| **TC-OFF-10**: Storage Quota | 1. Create many large todos<br>2. Check console | No quota exceeded errors | P2 |

### 4.2 Service Worker & PWA

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| **TC-PWA-01**: Service Worker Registration | 1. Visit app<br>2. Check DevTools > Application > Service Workers | SW registered, status "activated and running" | P0 |
| **TC-PWA-02**: Install Prompt Appears | 1. Visit app (supported browser)<br>2. Wait 2-3 seconds | "Add to Home Screen" prompt or install icon | P1 |
| **TC-PWA-03**: Manual PWA Install | 1. Chrome: 3-dot menu > "Install TodoPro" | App installs and opens standalone | P1 |
| **TC-PWA-04**: App Opens Standalone | 1. Open installed PWA | Opens without browser URL bar | P1 |
| **TC-PWA-05**: Offline App Works | 1. Install PWA<br>2. Go offline<br>3. Open PWA | App loads with cached assets | P0 |
| **TC-PWA-06**: API Cache (NetworkFirst) | 1. Go online, fetch todos<br>2. Go offline, refresh | Cached API response shown | P1 |
| **TC-PWA-07**: Font Cache (CacheFirst) | 1. Load app online<br>2. Go offline<br>3. Check DevTools > Cache > google-fonts-cache | Fonts served from cache | P2 |
| **TC-PWA-08**: Cache Invalidation | 1. Deploy new version<br>2. Check SW update | New service worker installs | P2 |
| **TC-PWA-09**: Manifest Valid | 1. Check DevTools > Application > Manifest | All icons, theme_color, display correct | P1 |
| **TC-PWA-10**: iOS PWA Support | 1. Visit on iOS Safari<br>2. Share > Add to Home Screen | Installs correctly on iOS | P2 |

### 4.3 Cross-Device Sync

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| **TC-SYNC-01**: Desktop to Mobile Sync | 1. Add todo on desktop<br>2. Open app on mobile | Todo appears on mobile | P1 |
| **TC-SYNC-02**: Reorder Sync | 1. Reorder todos on desktop<br>2. Check mobile | Order synced correctly | P1 |
| **TC-SYNC-03**: Offline Then Sync | 1. Go offline on mobile, add todo<br>2. Go online | Todo syncs to server and other devices | P1 |

---

## 📝 Phase 5: Admin Dashboard Testing

### 5.1 Dashboard Stats

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| **TC-ADMIN-01**: View Dashboard | 1. Login as admin<br>2. Click Admin button | Dashboard loads with stats | P0 |
| **TC-ADMIN-02**: Stats Accuracy | 1. Check total users/todos | Matches actual counts | P1 |
| **TC-ADMIN-03**: Active Users | 1. Check active users (7 days) | Accurate count | P1 |

### 5.2 User Management

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| **TC-ADMIN-04**: View All Users | 1. Go to Users tab | Paginated user list shown | P0 |
| **TC-ADMIN-05**: Search Users | 1. Search by email/name | Filtered results shown | P1 |
| **TC-ADMIN-06**: View User Details | 1. Click on user | User profile and todos shown | P1 |
| **TC-ADMIN-07**: Update User | 1. Edit user display name | Changes saved | P1 |
| **TC-ADMIN-08**: Delete User | 1. Delete a test user | User and all todos deleted | P1 |
| **TC-ADMIN-09**: Prevent Self-Delete | 1. Try to delete own account | Error: "Cannot delete your own admin account" | P1 |

### 5.3 Todo Management

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| **TC-ADMIN-10**: View All Todos | 1. Go to Todos tab | All todos across users shown | P0 |
| **TC-ADMIN-11**: Search Todos | 1. Search todo text | Filtered results | P1 |
| **TC-ADMIN-12**: Delete Any Todo | 1. Delete any todo | Deleted successfully | P1 |
| **TC-ADMIN-13**: Bulk Delete | 1. Select multiple todos<br>2. Delete | All selected deleted | P1 |

### 5.4 System Health

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| **TC-ADMIN-14**: Health Check | 1. Check /api/admin/health | Database connected, uptime shown | P1 |

---

## 📝 Phase 6: Profile & Settings Testing

### 6.1 Profile Management

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| **TC-PROF-01**: View Profile | 1. Click profile | Profile modal shows current info | P0 |
| **TC-PROF-02**: Update Display Name | 1. Change display name | Updated and reflected in UI | P1 |
| **TC-PROF-03**: Update Bio | 1. Add/edit bio | Saved and displayed | P2 |
| **TC-PROF-04**: Update Avatar | 1. Add avatar URL | Avatar displayed | P2 |
| **TC-PROF-05**: Delete Account | 1. Delete account | Account and all todos deleted | P0 |

---

## 📝 Phase 7: Email & OAuth Testing

### 7.1 Email Verification

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| **TC-EMAIL-01**: Request Verification | 1. Register (email not verified)<br>2. Request new verification | Email sent (if SMTP configured) | P1 |
| **TC-EMAIL-02**: Verify Email | 1. Click verification link | Email marked as verified | P1 |

### 7.2 Password Reset

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| **TC-PWR-01**: Request Reset | 1. Click forgot password<br>2. Enter email | Reset email sent (if SMTP configured) | P1 |
| **TC-PWR-02**: Reset Password | 1. Click reset link<br>2. Enter new password | Password updated successfully | P1 |
| **TC-PWR-03**: Invalid Reset Token | 1. Use expired/invalid token | Error: "Invalid or expired token" | P1 |

### 7.3 Google OAuth

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| **TC-GOOG-01**: Login with Google | 1. Click "Continue with Google" | Redirected to Google, then logged in | P0 |
| **TC-GOOG-02**: Link Google Account | 1. Login with email<br>2. Link Google account | Google account linked | P2 |
| **TC-GOOG-03**: Unlink Google Account | 1. Unlink Google account | Google account unlinked | P2 |
| **TC-GOOG-04**: Google-Only User Login | 1. Try password login with Google account | Error: "This account uses Google Sign-In" | P1 |

---

## 📝 Phase 8: UI/UX Testing

| Test Case | Steps | Expected Result | Priority |
|-----------|-------|-----------------|----------|
| **TC-UI-01**: Theme Toggle | 1. Switch between themes | Theme changes applied | P1 |
| **TC-UI-02**: Responsive Layout | 1. Test on mobile/tablet/desktop | Layout adapts correctly | P1 |
| **TC-UI-03**: Loading States | 1. Perform actions | Loading indicators shown | P2 |
| **TC-UI-04**: Error Messages | 1. Trigger errors | User-friendly error messages shown | P1 |
| **TC-UI-05**: Welcome Tour | 1. New user login | Tour guides through features | P2 |
| **TC-UI-06**: Quick Start Checklist | 1. New user | Checklist shows progress | P2 |

---

## 🎯 Risk-Based Testing Priority Matrix

### P0 - Critical Path (Must Test)
1. ✅ User Registration
2. ✅ User Login  
3. ✅ Create Todo
4. ✅ View Todos (decryption)
5. ✅ Toggle Todo Complete
6. ✅ Delete Todo
7. ✅ Logout
8. ✅ JWT Authentication
9. ✅ Admin Dashboard Access
10. ✅ Encryption/Decryption

### P1 - High Impact
1. Password Reset
2. Drag-and-Drop Reordering
3. Rate Limiting
4. Session Persistence
5. Offline Mode
6. Profile Update
7. Category/Priority
8. Admin User/Todo Management

### P2 - Medium Impact
1. Email Verification
2. Google OAuth
3. Tags & Due Dates
4. PWA Installation
5. Theme Switching
6. UI Responsiveness

---

## 🏃 Smart Execution Order

### Day 1: Authentication & Core Todos (High ROI)
```
1. Register → Login → Create Todo → View Todo → Toggle → Delete
2. Logout → Login again (session persistence)
3. Test encryption in API response
```

### Day 2: Advanced Features & Security
```
1. Drag-and-drop reordering
2. Categories, priorities, tags
3. Offline mode
4. Security: SQL injection, XSS, JWT
```

### Day 3: Admin & Edge Cases
```
1. Admin dashboard
2. User management
3. Password reset
4. Email verification
5. Google OAuth
```

---

## 📊 Test Data Requirements

### Sample Todos for Testing
```json
[
  { "text": "🔴 High Priority Work Task", "priority": "high", "category": "work" },
  { "text": "🟡 Medium Priority Personal", "priority": "medium", "category": "personal" },
  { "text": "🟢 Low Priority Shopping", "priority": "low", "category": "shopping" },
  { "text": "📅 Task with Due Date", "dueDate": "2024-12-31", "priority": "high" },
  { "text": "🔖 Tagged Task", "tags": ["urgent", "review"] },
  { "text": "😀 Emoji Task 🎉" }
]
```

---

## 🐛 Bug Reporting Template

| Field | Description |
|-------|-------------|
| **ID** | BUG-XXX |
| **Title** | Short description |
| **Severity** | Critical / Major / Minor |
| **Priority** | P0 / P1 / P2 |
| **Environment** | Browser, OS, Device |
| **Steps to Reproduce** | Detailed reproduction steps |
| **Expected Result** | What should happen |
| **Actual Result** | What actually happened |
| **Screenshots/Videos** | Visual evidence |
| **Logs** | Console/network logs |

---

## ✅ Test Sign-Off Checklist

- [ ] All P0 test cases passed
- [ ] All P1 test cases passed  
- [ ] All P2 test cases passed
- [ ] No critical security vulnerabilities
- [ ] Performance acceptable (< 200ms API response)
- [ ] Cross-browser compatibility verified
- [ ] Mobile responsive design verified
- [ ] Admin functionality verified
- [ ] Documentation updated

---

## 📅 Timeline Estimate

| Phase | Estimated Time | Focus |
|-------|----------------|-------|
| Phase 1 | 2 hours | Authentication |
| Phase 2 | 3 hours | Todo CRUD |
| Phase 3 | 2 hours | Security |
| Phase 4 | 2 hours | Offline/PWA |
| Phase 5 | 2 hours | Admin |
| Phase 6-8 | 2 hours | Other features |
| **Total** | **~13 hours** | Full testing |

---

*Last Updated: 2024 | Version 1.0*

