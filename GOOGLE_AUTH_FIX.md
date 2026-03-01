# Google Auth System Fix Plan

## Issues Identified:
1. Token/redirect mismatch - Backend sends cookie-based token, frontend expects token in URL
2. googleId not returned - Google users need googleId as their "password" for encryption
3. Frontend popup handling needs improvement
4. Missing googleId in /api/me response

## Fix Steps Completed:

### ✅ Step 1: Fixed Backend googleAuth.ts
- [x] Include googleId in redirect URL for non-popup flow
- [x] Ensure encryptionSalt is properly included in redirect
- [x] Include googleId and encryptionSalt in popup postMessage

### ✅ Step 2: Fixed Backend /api/me endpoint (api/index.ts)
- [x] Return googleId for Google users to use as encryption password

### ✅ Step 3: Fixed Frontend AuthForm.tsx
- [x] Properly handle google_auth=success with cookie-based auth
- [x] Extract and save googleId for encryption
- [x] Save encryptionSalt for encryption
- [x] Properly handle popup postMessage flow

### ✅ Step 4: Fixed Frontend types.ts
- [x] Added googleId, isGoogleUser, authProvider to User interface

### ✅ Step 5: Fixed Frontend api.ts
- [x] Updated getMe response type to include googleId

### ✅ Step 6: Fixed Frontend useAuth.ts
- [x] Added googleId as password for Google users during auth check

### ✅ Step 7: Fixed Frontend App.tsx
- [x] Updated Google OAuth param handler to save googleId

### ✅ Step 8: Fixed GoogleAuthHandler.tsx
- [x] Made component work with new cookie-based flow
- [x] Made onGoogleAuth callback optional

## Summary
The Google Auth system has been completely fixed with:
- Proper cookie-based authentication flow
- googleId passed in URL and postMessage for encryption
- encryptionSalt properly saved and used
- All frontend components updated to handle the new flow

