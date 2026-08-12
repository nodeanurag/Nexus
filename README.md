# Nexus — Collaborative Project Management SaaS

Nexus is a premium, high-performance Project Management SaaS platform built using **Next.js (App Router)**, **Tailwind CSS**, and **Prisma ORM with PostgreSQL**. It acts as a single source of truth for agile product teams, offering workspaces, drag-and-drop Kanban boards, real-time broadcast chats, timer stopwatches, activity audit logs, and developer integrations.

---

## 🚀 Quick Navigation

To learn more about the technical details, architecture, and configuration of Nexus, please review our comprehensive guide directories:

* 📖 **[Getting Started Guide](/doc/getting-started.md)**: Setup environment keys, DB migrations, and local dev server setup.
* 🛠️ **[Architecture Manual](/doc/architecture.md)**: Details of the Next.js Server Actions framework, folder mapping, and polling flows.
* 📦 **[Features Reference Guide](/doc/features.md)**: Complete analysis of all 15 platform features (Themes, Timers, Confetti, Chats).
* 🗄️ **[Database Schema Reference](/doc/database.md)**: Details of PostgreSQL relational models, cascades, and constraints.

---

## ✨ Key Feature Highlights

### 🎨 Premium Dark Obsidian & Light Paper Themes
A custom high-contrast obsidian dark palette (`#000000` base) and paper light palette with custom CSS transitions. Includes a responsive sidebar switch.

### 📋 Interactive Kanban Drag-and-Drop
Features status columns (`Backlog`, `Todo`, `In Progress`, `Review`, `Done`) with optimistic drag drop sorting and confetti explosion animations on completing task cards.

### 💬 Short-Polling Broadcast Chatroom
A workspace-wide broadcasting live chat updates every 3 seconds, featuring optimistic sends, emoji reaction counters, and hotkey keyboard commands (e.g. `Ctrl + I` focus, `Ctrl + Shift + B` scroll).

### ⏱️ Integrated Stopwatch Timers
Stopwatch logs running inside task cards. Stopped timers automatically register time entries inside the workspace Activity feed tab.

### 🔌 GitHub Commit Webhook Feed
A webhook integration card in settings allowing repositories to broadcast push commits directly into the workspace Activity feed tab.

---

## 🛠️ Tech Stack Core

- **Framework**: Next.js 15 (App Router, Server Actions)
- **Database**: PostgreSQL (Supabase / local PG server)
- **ORM**: Prisma Client v6
- **Auth**: NextAuth.js v5 (Auth.js) credentials auth
- **Design System**: Tailwind CSS & Vanilla CSS variables
- **Animations**: canvas-confetti & tailwind-animate

---

## ⚙️ Quick Start

### 1. Installation
```bash
npm install
```

### 2. Configure Environment variables
Rename `.env.example` to `.env` and fill in `DATABASE_URL` and `NEXTAUTH_SECRET`.

### 3. Initialize database
```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Run development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the app dashboard.
