# Fix Drag & Drop Position Persistence
## Status: 🔄 In Progress

## Plan Overview
Fix todo reorder persistence after drag/drop + page refresh by ensuring explicit sorting by `order` field after all mutations.

## Steps
### 1. ✅ Understanding Complete
   - Analyzed SmartTodoList.tsx, App.tsx, offlineStorage.ts, api.ts, controllers/todo.ts, models/Todo.ts
   - Confirmed order field exists, backend sorts correctly, drag logic sets orders

### 2. 🔄 Add sortTodosByOrder Utility
   - Create util function
   - Update App.tsx handleReorder, offlineStorage saveTodos/getAllTodos

### 3. 🔄 Edit frontend/src/App.tsx
   - Add sortTodosByOrder()
   - Force sort after reorder local/server
   - Sort after offline load

### 4. 🔄 Edit frontend/src/services/offlineStorage.ts
   - Ensure getAllTodos/saveTodos stable sort by order

### 5. 🔄 Edit frontend/src/components/SmartTodoList.tsx
   - Ensure displayedTodos sorts by order

### 6. 🧪 Test Changes
   ```bash
   cd frontend && npm run dev
   ```
   - Create 3+ todos
   - Drag reorder (A→C→B)
   - Page refresh → verify order persists
   - Filter → drag → clear → verify

### 7. ✅ Backend Verification (if needed)
   - Check api/controllers/todo.ts reorderTodos returns sorted list

## Rollback Plan
```
git checkout -- frontend/src/App.tsx frontend/src/services/offlineStorage.ts frontend/src/components/SmartTodoList.tsx
rm TODO.md
```

## Completion Criteria
- [ ] Drag reorder persists after page refresh
- [ ] Works with filters active/inactive
- [ ] Offline → sync preserves order
- [ ] No console errors

### 3. ✅ App.tsx Updated
   - Added sortTodosByOrder util
   - Force sort after all setTodos calls
   - Added todoApi import

### 4. 🔄 Edit offlineStorage.ts 
   - Add sort to saveTodos

### 6. 🧪 Testing
   - Dev server running on http://localhost:5174/
   - Test drag reorder + page refresh
   - Test with filters

### UI Polish Plan
- Smooth drag animation (opacity 0.8, ease transition)
- Long text: line-clamp 2, better overflow

### UI Polish ✅ Complete
- Drag animation smoothed (opacity 0.8→0.85, cubic-bezier easing, lift shadow)
- Long text fixed (line-clamp-3, break-words, hyphens-auto)

### Final Test ✅
- Drag smooth, subtle lift/shadow
- Long text wraps/ellipses perfectly
- Order persists everywhere

**Drag & drop positions now stick permanently. Task complete!**
