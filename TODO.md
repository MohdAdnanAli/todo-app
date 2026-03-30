# Todo App - Logout Sync ✅ COMPLETE

**Date:** Current
**Changes:**
- **Logout now saves todo order/checked** before clearing session (email + Google users)
- `App.tsx`: Added `syncAll()` (2s timeout) + `saveTodos()` fallback + UI feedback
- `offlineStorage.ts`: `unshift()` new todos (recent-first, order 0 at top)
- Preserves state across logout/reload/offline

## Status: ✅ FULLY IMPLEMENTED & TEST-READY

## 🔍 MANUAL API TESTS (Postman/cURL)

### 1. Auth (Get cookies)
```
POST /api/auth/login
Content-Type: application/json
{
  "email": "test@example.com",
  "password": "Test123!"
}
```

### 2. Profile API
```
GET /api/profile                           # Get profile
PUT /api/profile
Content-Type: application/json
{
  "displayName": "John Doe",
  "bio": "Updated bio"
}                                          # Update profile
DELETE /api/profile                        # Delete account
```

### 3. Sync API (use cookies from auth)
```
# Full list
GET /api/todos

# Delta changes
GET /api/todos/delta?since=2024-01-01T00:00:00Z

# Batch sync (offline → online)
POST /api/todos/batch-sync
Content-Type: application/json
{
  "creates": [{"text": "Offline task", "category": "work"}],
  "updates": [{"id": "mongo_id", "data": {"completed": true}}],
  "deletes": ["mongo_id"]
}

# Reorder
POST /api/todos/reorder
Content-Type: application/json
{
  "todos": [{"id": "id1", "order": 0}, {"id": "id2", "order": 1}]
}
```

### 4. Server Commands
```bash
# Backend
cd api && bun index.ts

# Frontend (test offline sync)
cd frontend && bun dev

# Offline test:
# 1. DevTools > Network > Offline
# 2. Add todo → saves locally  
# 3. Online → auto-syncs to server
```

## 📝 YOUR CHANGES TODO LIST
```
[ ] Add feature: _______________
[ ] Fix bug: __________________
[ ] UI update: ________________
[ ] Deploy: ___________________
```

**All BLACKBOXAI fixes applied. Project ready for your development! 🚀**

