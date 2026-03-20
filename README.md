# 🚀 METB Todo – Lightning-fast Offline-First Todo App

[![Vercel](https://img.shields.io/badge/Vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/tests-100%25-brightgreen.svg)](https://github.com/MohdAdnanAli/todo-app/actions)
[![Bun](https://img.shields.io/badge/Bun-%23ffcb03.svg?style=flat&logo=bun&logoColor=white)](https://bun.sh)
[![Deployed on Vercel](https://therealsujitk-vercel-badge.vercel.app/?app=metb-todo)](https://metb-todo.vercel.app)

## ✨ Hero

**Lightning-fast offline-first todo app with drag-drop reordering, smart filters, custom themes, and seamless sync – powered by Bun for ultimate speed!**

![Hero Demo](./public/demo.gif)

## 🚀 Features (All Battle-Tested)

- **📱 Offline-First Sync**: Full optimistic UI with localStorage queue, bidirectional merge (local→remote + remote→local), auto-sync on reconnect
- **✅ Now installable PWA – works offline, survives airplane mode!** (VitePWA + auto install prompt)
- **✨ Drag-Drop Reordering**: @dnd-kit powered (touch/keyboard/mobile sensors), works with active filters, visual overlay
- **🎯 Priorities, Dues & Categories**: High/Med/Low priority, due dates, 5 categories (work/personal/shopping/health/other) + real-time filters/search
- **🌈 Theme Engine**: 10+ presets + live custom color picker (bg/text/accent), system mode support
- **🎉 Onboarding Perfection**: 7-step Joyride tour, quick-start checklist, example todos on signup
- **⚡ Blazing Bun Backend**: Full-stack speed with Express/MongoDB/Zod validation, email drip (Day 1/3/7)
- **🔍 Smart Filters**: Category/priority/completed/search with live stats (e.g., 42% complete), clear all button
- **🛡️ Secure Auth**: Google OAuth + email/password, rate-limiting, XSS protection
- **📊 Admin Dashboard**: User stats, todo analytics, pagination (frontend + backend)

> **Quality**: ✅ Production-ready • Comprehensive tests (drag-drop 12/12, offline 13/13)

## 🔗 Get Started

[![Deploy Frontend (Vercel)](https://vercel.com/new/clone?repository-url=https://github.com/MohdAdnanAli/todo-app/tree/main/frontend)](https://metb-todo.vercel.app) [![Deploy Backend (Render)](https://render.com/deploy-btn)](https://render.com)

**Frontend:** Deploy to Vercel (drag-drop public/ folder or git connect this repo).
**Backend:** Deploy to Render (Bun runtime) or self-host: `cd api && bun run start`.

1. Clone/fork → `bun install` (root + api/ + frontend/)
2. Backend: `cd api && bun run start`
3. Frontend: `cd frontend && bun run dev`
4. Open http://localhost:5173 – works offline!

## 🗺️ Roadmap

- 🔄 **Recurring Tasks**: Flex scheduling ("every Mon" or "every 3 workdays")
- ⏱️ **Pomodoro Timer**: Built-in 25-min focus sessions + breaks
- 🤖 **AI Assist**: Mail summarization, auto-scheduling, promptfoo integration
- 📈 **Time Tracking**: Duration estimates, finish-time predictor, habit streaks
- 📱 **Mobile-First**: iOS/Android responsive polish + safe-area support

## Contributing
Pull requests welcome! For major changes, please open an issue first to discuss desired changes.

## 📝 Topics
todo-app, productivity, pwa, offline-first, bunjs, task-manager, full-stack, react, vite, drag-drop, typescript

---

**Support my work ☕** [Ko-fi](https://ko-fi.com/geralt_of_rivia)

