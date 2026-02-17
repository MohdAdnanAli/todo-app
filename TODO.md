# Todo Encryption Implementation Plan

## Steps:
- [x] 1. Update User model - add encryptionSalt field
- [x] 2. Update auth controller - return salt on login/register
- [x] 3. Create frontend crypto utilities (crypto.ts)
- [x] 4. Update frontend App.tsx - encrypt/decrypt todos
- [x] 5. Update API /me endpoint to return encryptionSalt
- [x] 6. Handle legacy users (generate salt on first login)
- [x] 7. Test - API runs correctly

