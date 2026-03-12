# UI Responsiveness Fixes - Mobile-First Plan
Status: ✅ Approved | Priority: iPhone/Android → Tablet → Desktop

## Steps (4/4 remaining)

### 1. [ ] Create TODO.md (Tracking)
Create this file for progress tracking.

### 2. [ ] Fix TodoItem.tsx Text Overflow
- Add `hyphens: auto; overflow-wrap: anywhere; max-width: clamp(200px, 85vw, 400px)`
- Improve badge wrapping/spacing on tiny screens
- Test: Very long words/emojis

### 3. [ ] Enhance SmartTodoList.tsx Mobile UX
- Filter buttons: min-height:48px touch targets
- Drag handle: larger padding (p-2 → p-2.5 mobile)
- Filter panel: Better mobile stacking

### 4. [ ] Global CSS Mobile Polish (index.css)
- Hide scrollbars on mobile webkit
- Add safe-area insets (@supports(padding: env(safe-area-inset-top)))
- iOS zoom fix for inputs

### 5. [ ] App.tsx Header Responsiveness
- Avatar truncation/whitespace-nowrap → flex-shrink
- Button sizing consistency across breakpoints

### 6. [ ] Test & Validate
```
bun run dev
Chrome DevTools: 320px → 1920px
iPhone 12/14 simulators
Lighthouse PWA audit
bunx vitest (layout tests if exist)
Screenshots: before/after mobile/desktop
```

### 7. [ ] Complete
- Update TODO.md ✅ marks
- attempt_completion with demo command
- CHANGELOG.md entry

**Next: Edit TodoItem.tsx**
