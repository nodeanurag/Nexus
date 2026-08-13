# Features Reference Guide

Nexus contains a rich suite of tools designed to streamline team collaboration, tracking, and management.

---

## 1. Authentication & Security
- **Credentials Auth**: Standard secure email/password logins powered by NextAuth v5.
- **Middleware Protections**: Secure access layers that auto-redirect unauthenticated users to `/login`.
- **Role-based Capabilities**: Restricts workspace and project modifications based on workspace membership roles:
  - **OWNER**: Absolute control (can transfer ownership, delete workspaces, update roles).
  - **ADMIN**: Access settings, modify projects, invite members, edit tasks, remove regular members.
  - **MEMBER**: Create/modify tasks, join projects, read workspaces, participate in chats.
  - **VIEWER**: Read-only access (cannot drag tasks, post messages, or alter details).

---

## 2. Workspace Management
- **Workspace Hub**: Create multiple workspaces to separate organizations or teams.
- **Team Access Directory**: Add or remove members, assign administrative permissions, and revoke outstanding invitations.
- **Settings Panel**: Rename workspaces, transfer ownership to other administrators, or permanently delete workspaces.

---

## 3. Projects & Kanban Boards
- **Modular Project Boards**: Group tasks by project inside workspaces.
- **Drag-and-Drop Column Boards**: Visual columns tracking task lifecycle: `Backlog` ➔ `Todo` ➔ `In Progress` ➔ `Review` ➔ `Done`.
- **Done Confetti Blasts**: Instantly releases a celebrate particles blast when dropping tasks onto the `Done` status column.
- **Dynamic Prioritization**: Color-coded badges highlighting task urgency levels (`Low`, `Medium`, `High`, `Urgent`).

---

## 4. Task Collaboration & Logging
- **Task Details View**: Detailed dialog modal tracking description, priority weight, assignees, and checklist items.
- **Checklist Manager**: Add checklist items to tasks and monitor completed items ratio.
- **Comments Thread**: Real-time comments feed inside tasks for team discussions.
- **Activity Log Feed**: Tracks workspace updates (e.g. task creations, column changes) to maintain a complete audit log.

---

## 5. Live Broadcast Chatroom
- **Short-Polling Sync**: Broadcaster workspace chat room that updates messages and reactions dynamically every 3 seconds.
- **Optimistic Rendering**: Message sends, reactions toggle, and deletions reflect instantly for lag-free performance.
- **Emoji Reactions Picker**: Toggle reactions on messages (👍, ❤️, 🔥, 👀) with counter capsules.
- **Keyboard Shortcuts**: Quick hotkey commands to enhance chat speed:
  - `Ctrl + I`: Focus the message entry box.
  - `Ctrl + Shift + B`: Smooth scroll to the bottom of the feed.
  - `Esc`: Clear input focus.

---

## 6. Time Tracking Timer
- **Live Stopwatch**: Run a stopwatch timer inside tasks to track work hours.
- **Time History Logs**: Logs elapsed durations to PostgreSQL database, which automatically registers time logging entries inside the Workspace Activity Feed.

---

## 7. Customization & Integrations
- **Obsidian Dark / Paper Light Themes**: High-contrast theme switcher accessible from the sidebar.
- **GitHub Commit Webhook**: Registers pushing commits to your GitHub repositories inside the Workspace Activity Feed automatically. Config instructions panel with copyable URLs is integrated into workspace settings.
