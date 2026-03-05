# 🚀 Quick Test Checklist - Todo App

> **Print this and check off as you go!** Run through this in ~35 minutes for quick validation.

---

## ⏱️ Pre-Flight Check
- [ ] Backend running on `http://localhost:5000`
- [ ] Frontend running on `http://localhost:5173`
- [ ] Test accounts ready (see below)
- [ ] Browser DevTools open (Console tab)

---

## 🔐 AUTH TESTS (10 min)

### Login Flow
- [ ] **A1** - Register new account → verify email NOT required for login
- [ ] **A2** - Login with correct credentials → should show todos
- [ ] **A3** - Login with wrong password → "Invalid credentials"
- [ ] **A4** - Close browser, reopen → auto-login via cookie
- [ ] **A5** - Logout → verify password cleared from storage

### Security
- [ ] **A6** - Try 5 wrong passwords → account locked message
- [ ] **A7** - Register with temp email (mailinator.com) → blocked

---

## 📝 TODO TESTS (15 min)

### CRUD
- [ ] **T1** - Add todo → appears at TOP of list
- [ ] **T2** - Toggle complete → status changes immediately
- [ ] **T3** - Delete todo → confirm dialog works
- [ ] **T4** - Add empty todo → error shown

### Features
- [ ] **T5** - Add todo with category (work/personal) → category shown
- [ ] **T6** - Add todo with priority (high/medium/low) → priority shown
- [ ] **T7** - Drag to reorder → order persists after refresh

### Encryption (CRITICAL)
- [ ] **T8** - Create todo, check Network tab → text is ENCRYPTED (base64)
- [ ] **T9** - Refresh page → text is DECRYPTED correctly
- [ ] **T10** - Logout, login → todos still decrypt properly

---

## 📴 OFFLINE & PWA TESTS (10 min)

### IndexedDB & Sync Queue
- [ ] **O1** - Add todo, check DevTools > Application > IndexedDB > TodoAppDB > todos → todo stored
- [ ] **O2** - DevTools > Network > toggle "Offline" → go offline
- [ ] **O3** - Add todo while offline → saved to IndexedDB
- [ ] **O4** - Check IndexedDB > syncQueue → action queued
- [ ] **O5** - Go online → todo syncs to server, queue cleared
- [ ] **O6** - Check IndexedDB > metadata → password & encryption salt stored

### Service Worker & PWA
- [ ] **P1** - Check DevTools > Application > Service Workers → "activated and running"
- [ ] **P2** - Check for install prompt (Chrome: 3-dot menu or address bar icon)
- [ ] **P3** - Install PWA → opens standalone (no URL bar)
- [ ] **P4** - Go offline, open installed PWA → works with cached assets
- [ ] **P5** - Check DevTools > Application > Manifest → icons, theme correct
- [ ] **P6** - Check DevTools > Cache → api-cache, google-fonts-cache present

---

## ⚙️ ADMIN TESTS (5 min)

- [ ] **Admin1** - Login as admin → Admin button visible
- [ ] **Admin2** - Open Admin Dashboard → stats load correctly
- [ ] **Admin3** - View all users → user list shows
- [ ] **Admin4** - Delete a test todo from admin → deleted from system

---

## 🎨 UI TESTS (5 min)

- [ ] **U1** - Switch theme → theme changes
- [ ] **U2** - Resize to mobile → layout responsive
- [ ] **U3** - Check for console errors → none critical

---

## 📋 Test Accounts

| Action | Email | Password |
|--------|-------|----------|
| Regular User | `testuser@test.com` | `TestPass123!` |
| Admin | Check `.env` → `ADMIN_EMAIL` | (your admin account) |

---

## 🐛 Quick Bug Report Format

```
BUG-[#]: [Short title]
Steps: 1. ... 2. ...
Expected: ...
Actual: ...
Severity: Critical/Major/Minor
```

---

## ✅ Sign-Off

- [ ] All A-tests passed
- [ ] All T-tests passed  
- [ ] All O-tests passed
- [ ] All Admin-tests passed
- [ ] No critical bugs open

**Tester**: ____________  **Date**: ____________

---

*See MANUAL_TESTING_PLAN.md for full details*

