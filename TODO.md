# Todo Decryption Bug Fix - Progress 43%

## Status  
**Plan approved ✓ | Steps 1-4 complete ✓ | Progress: 43%**

## Current State
```
✅ 1. TODO.md ✓
✅ 2. Research ✓ (App.tsx confirmed)
✅ 3. offlineStorage.ts ✓ 
   - getAllTodos(decryptFn?) ✓
   - getRawTodos() ✓ (sync safe)  
✅ 4. useAuth.ts ✓
   - useLocalTodoDecryption ✓
   - unlock() auto-decrypts ✓
   - needsUnlock logic ✓ (fixed TS)
⏳ 5. App.tsx (60% → unlock modal + decrypt flow)
```

## Next: Step 5 - App.tsx Integration
```
1. Import useLocalTodoDecryption, PasswordUnlockModal
2. Load RAW todos → pass to hook  
3. Show <PasswordUnlockModal isOpen={needsUnlock} />
4. Fix saveTodos(RAW_ENCRYPTED only)
5. Decrypt display todos → SmartTodoList
```

## Key Fixes Applied
```
• Storage now decrypt-aware (raw by default)
• Hook detects unlock need + auto-decrypts  
• TS fixed (useMemo imported)
• Backwards compatible
```

## Test Preview
```
npm run dev → login → encrypted todos → 
Unlock modal → password → INSTANT decrypted todos ✓
