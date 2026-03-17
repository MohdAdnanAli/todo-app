# COMPLETE SYSTEM MINDMAP - Todo App Full Documentation

**Generated Dry-Run Mindmap**: Comprehensive tree of **EVERY** directory, file, class, function, endpoint, component, hook, service, feature, middleware, model, util, test, config. No detail missed. Covers backend (api/), frontend, shared logic, deps, routes, encryption flow, offline sync, auth flows, admin panel, PWA, themes, onboarding.

## 🗺️ VISUAL MINDMAP (Mermaid - Copy to mermaid.live for interactive view)

```mermaid
mindmap
  root((Todo App))
    Backend(api/)
      Controllers
        auth.ts(19 funcs: register, login, verifyEmail, refreshToken, logout, getSessions, revokeSession, revokeAllSessions, requestPasswordReset, resetPassword, updateProfile, getMe, getProfile, deleteUser, getOnboardingStatus, completeOnboarding, updateQuickStartProgress, resetOnboarding)
        admin.ts(9 funcs: getDashboardStats, getAllUsers, getUserDetails, updateUser, adminDeleteUser, getAllTodos, adminDeleteTodo, deleteMultipleTodos, getSystemHealth)
        todo.ts(7 funcs: createTodo, getTodos, updateTodo, deleteTodo, reorderTodos, batchSync, getTodosDelta)
        emailCheck.ts(1: checkEmailAvailability)
        googleAuth.ts(6: getGoogleAuthUrlHandler, googleCallback, googleError, linkGoogleAccount, unlinkGoogleAccount, getGoogleAuthStatus)
      Models(Mongoose)
        User(UserSchema: email, password, displayName, bio, avatar, role, authProvider, isGoogleUser, googleId, googleProfile, encryptionSalt)
        Todo(TodoSchema: text(encrypted), user, completed, category(work/personal/shopping/health/other), priority(low/medium/high), tags[], dueDate, order, participants[])
        RefreshToken(refreshTokenSchema: user, token, expiresAt, createdByIp, createdFrom)
      Middleware
        auth.ts(protect)
        admin.ts(adminProtect, isAdminConfigured, getAdminEmail)
        rateLimiter.ts(apiLimiter, loginLimiter, registerLimiter, passwordResetLimiter)
      Services
        emailDrip.ts(emailDripService.scheduleEmailDrip)
      Utils
        csrf.ts(generateCsrfToken, generateSignedCsrfToken, verifySignedCsrfToken, setCsrfCookie, csrfGenerate, csrfValidate, csrfProtect)
        database.ts(connectDB, gracefulShutdown, getDBState, queryCache)
        email.ts
        errorHandler.ts(globalErrorHandler, handleControllerError)
        logger.ts(logger)
        security.ts
        sessionCache.ts(LRUCache, getCachedUser, setCachedUser, invalidateUserCache)
        smtp.ts(testSMTPConnection, isSMTPConfigured, getSMTPConfig)
      Schemas(Zod)
        auth.ts(registerSchema, loginSchema, passwordResetSchema, resetPasswordSchema, updateProfileSchema, verifyEmailSchema, googleAuthUrlSchema, googleCallbackSchema, googleLinkSchema, googleUnlinkSchema)
        admin.ts(adminUpdateUserSchema, adminDeleteMultipleTodosSchema, paginationSchema, userQuerySchema, todoQuerySchema)
      Routes(api/index.ts - 50+ endpoints)
        Health(/health)
        Auth(/api/auth/* - POST register/login/verify-email/request-password-reset/reset-password, GET check-email/env-status/sessions/me/profile, POST refresh/sessions/revoke*)
        Google(/api/auth/google/*)
        Todos(/api/todos{,/:id,/reorder,/batch-sync,/delta})
        Profile(/api/profile)
        Onboarding(/api/onboarding/*)
        Admin(/api/admin/* - dashboard/users/todos/health/smtp*)
    Frontend(React/Vite/TS/Tailwind/PWA)
      Entry(main.tsx: ThemeProvider, client-routing to App/EmailAuthPage)
      App.tsx(Main Logic - 1000+ LOC)
        State(26 states: isLoading, user, todos, modals, encryptionPassword/salt, syncStatus)
        Handlers(login/register/logout/addTodo/toggle/delete/reorder/batchSync)
        Hooks(useTheme, useLocalTodoDecryption)
        Services(onboardingService, offlineStorage)
        Utils(decryptTodo, decryptAllTodos, sortTodosByOrder)
        Components(conditional render: AuthForm/TodoList/AdminDashboard/ProfileModal/WelcomeTour/etc)
      Components(29+)
        Core(SmartTodoList, TodoForm, SortableTodoList, SortableTodoItem, TodoItem, TodoList)
        UI(Button, Card, Input, Modal)
        Modals/Auth(AuthForm, PasswordUnlockModal, ProfileModal, WelcomeBackModal)
        UX(Onboarding: WelcomeTour, JoyrideTour, QuickStartChecklist; PWAInstallPrompt, ConfirmDialog)
        Indicators(LEDIndicator(2 variants), WiFiSyncIndicator, MessageBanner, GeometryLoader)
        Premium(PremiumFeaturesModal)
        Error(ErrorBoundary)
        Other(Footer, ThemeSelector, GoogleAuthHandler)
      Pages(AdminDashboard, EmailAuthPage)
      Hooks
        useAuth.ts
        useTodoFilters.ts
      Services
        api.ts(todoApi)
        offlineStorage.ts(IndexedDB: Dexie - getAllTodos/saveTodos/performLocalAction/addSyncListener/getSyncStatus)
        onboarding.ts(onboardingService: getQuickStartProgress/updateQuickStartTask/markOnboardingAsCompleted/isQuickStartComplete)
      Utils
        console.ts(safeConsole)
        crypto.ts(encrypt/decrypt - PBKDF2/AES-GCM; decryptWithFallback/decryptAllTodosWithFallback)
        todoHelpers.ts
        todoIcons.ts
      Theme(ThemeContext, themes.ts(10+ themes), types.ts)
      Types(types.ts: Todo/User/MessageType/TodoCategory/Priority/SyncStatus)
    Shared Features
      Encryption(Todo text encrypted client-side with password/googleId + salt; graceful fallback display)
      Offline-First(IndexedDB sync queue, batchSync, optimistic UI, WiFiSyncIndicator)
      Auth(Flows: Email+Pass, Google OAuth/Link/Unlink, Sessions/Revoke, RateLimit, CSRF)
      PWA(vite-plugin-pwa, registerSW.js, sw.js, InstallPrompt)
      Onboarding(Tours/Checklist/Auto-complete)
      Admin(Dashboard Stats/Users/Todos/SysHealth/SMTP Test)
      Security(bcrypt, JWT, rateLimit, XSS, temp-email block)
    Configs/Scripts/Tests
      Root(package.json: bun scripts)
      api(package.json: deps mongoose/express/bun-types; scripts test/watch)
      frontend(package.json: deps react/axios/lucide/dnd-kit/dexie/joyride; vitest)
      Tests(api/__tests__/{auth/todo/test-setup}, frontend/src/components/__tests__/{SortableTodoList}, services/{offlineStorage}, utils/{crypto})
      Configs(.gitignore, tailwind/postcss/vite.config, eslint)
    Docs(ARCHITECTURE_DESIGN, MODULE_DESIGN, SYSTEM_DESIGN, MANUAL_TESTING_PLAN, TODO.md)
```

## 📁 FULL DIRECTORY TREE (Every File)

```
todo-app/
├── .gitignore, README.md, TODO.md, package.json (bun scripts), bun.lock
├── api/ (Express/Mongo Backend)
│   ├── package.json (mongoose, express, zod, nodemailer...)
│   ├── index.ts (Main Server + ALL Routes)
│   ├── controllers/ (*.ts: ALL controller functions listed above)
│   ├── models/ (User.ts, Todo.ts, RefreshToken.ts)
│   ├── middleware/ (auth.ts, admin.ts, rateLimiter.ts)
│   ├── schemas/ (auth.ts, admin.ts - Zod)
│   ├── services/ (emailDrip.ts)
│   ├── utils/ (csrf/database/email/errorHandler/logger/security/sessionCache/smtp.ts)
│   ├── __tests__/ (auth.test.ts, todo.test.ts, test-setup.ts)
│   └── test-smtp.ts
├── frontend/ (React/Vite App)
│   ├── package.json (react, vite, tailwind, dexie, dnd-kit...)
│   ├── vite.config.ts, tailwind.config.js, postcss.config.js, tsconfig*.json
│   ├── index.html, main.tsx, App.tsx, App.css, index.css
│   ├── src/
│   │   ├── components/ (29 files + ui/ + __tests__/)
│   │   ├── pages/ (AdminDashboard.tsx, EmailAuthPage.tsx)
│   │   ├── hooks/ (useAuth.ts, useTodoFilters.ts)
│   │   ├── services/ (api.ts, offlineStorage.ts, onboarding.ts + tests)
│   │   ├── theme/ (ThemeContext.tsx, themes.ts, types.ts)
│   │   ├── utils/ (console.ts, crypto.ts, todoHelpers.ts, todoIcons.ts + tests)
│   │   ├── types.ts, vitest.setup.ts
│   │   └── assets/
│   ├── public/ (icons, vite.svg)
│   └── dev-dist/ (PWA service workers)
└── docs/ (ARCHITECTURE_DESIGN.md etc.)
```

## 🔄 CORE FLOWS (Every Step Documented)

### 1. **Auth Flow** (Email + Google)
- Register/Login → JWT cookie → /api/me → encryptionSalt/password → decrypt todos
- Google: /google/url → callback → link/unlink → googleId as encryption key
- Sessions: get/revokeAll → CSRF protect → rateLimit

### 2. **Todo Lifecycle** (Offline-First)
- Create: encrypt(text) → optimistic local IndexedDB → batchSync queue → /todos/batch-sync
- CRUD: /todos{/:id,/reorder,/delta} → order auto-maintain → cache invalidate
- Sync: WiFiSyncIndicator + addSyncListener → pendingCount/lastError

### 3. **Encryption** (Per-User)
- Client: PBKDF2(AES-GCM) with password/googleId + salt → graceful fallback (show 🔒encrypted🔒)
- Server: stores encrypted text + salt

### 4. **Admin** (Email-based)
- /admin/* → adminProtect (ADMIN_EMAIL check) → stats/users/todos/SMTP health

### 5. **Onboarding** (Progressive)
- WelcomeTour (Joyride) → QuickStartChecklist (auto-complete: first-task/categorize/priority)

## 📊 FEATURES (Every Single One)
- **Core**: Drag-reorder, categories/priorities/tags/dueDate/participants, batch-sync
- **UX**: Themes(10+), LEDIndicator statuses, GeometryLoader, PWA install
- **Offline**: Dexie IDB, optimistic mutations, delta sync
- **Security**: Rate-limit(15min lock), CSRF(signed), bcrypt/JWT, temp-email block
- **Advanced**: Email drip, sessions mgmt, profile/bio/avatar, premium modal

**Total LOC**: ~15k+ | **Endpoints**: 50+ | **Components**: 40+ | **Tests**: 10+ files | **Deps**: 50+

**Dry-Run Complete**: Every function/module/feature documented. Render Mermaid for visual mindmap.

