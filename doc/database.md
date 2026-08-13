# Database Schema Reference

Nexus uses a PostgreSQL database schema managed via **Prisma ORM**. Below are the schema definitions, relations, and indices.

---

## 1. Authentication & Users

### `User`
Stores core user registration accounts.
- **Relations**:
  - `ownedWorkspaces`: One-to-many relationship with `Workspace` (representing workspaces created by the user).
  - `workspaceMembers`: One-to-many relationship with `WorkspaceMember` (representing memberships in workspaces).
  - `assignedTasks`: Tasks assigned to this user.
  - `createdTasks`: Tasks created by this user.
  - `createdProjects`: Projects created by this user.

---

## 2. Workspaces & Access Control

### `Workspace`
The parent organization container for projects and chats.
- **Relations**:
  - `owner`: Linked to the `User` who created it.
  - `members`: WorkspaceMember joins (Access directory).
  - `projects`: Projects created under this workspace.
  - `logs`: Activity logs auditing updates inside this workspace.
  - `invitations`: Workspace invitations sent to other users.

### `WorkspaceMember`
Joins workspaces and users, specifying roles.
- **Fields**:
  - `role`: `OWNER` | `ADMIN` | `MEMBER` | `VIEWER`.
- **Constraint**: `@@unique([workspaceId, userId])` prevents duplicate memberships.
- **On Delete**: `Cascade` on User/Workspace deletions.

### `WorkspaceInvitation`
Tracks workspace invites pending registration.
- **Constraint**: `@@unique([workspaceId, email])`.
- **Fields**:
  - `token`: Unique invitation link parameter.
  - `expiresAt`: Timestamp mapping token validity.

---

## 3. Projects & Kanban Boards

### `Project`
Groups related boards/tasks inside a workspace.
- **Fields**:
  - `status`: `ACTIVE` | `COMPLETED` | `ARCHIVED`.
- **Relations**:
  - `workspace`: Linked to its workspace.
  - `tasks`: Child tasks inside this project.

### `Task`
A backlog/board item.
- **Fields**:
  - `status`: `BACKLOG` | `TODO` | `IN_PROGRESS` | `REVIEW` | `DONE`.
  - `priority`: `LOW` | `MEDIUM` | `HIGH` | `URGENT`.
  - `position`: Integer value ordering tasks within columns.
- **Relations**:
  - `comments`: Comments thread linked to the task.
  - `timeLogs`: Work stopwatch logs.

---

## 4. Time Logs, Chats, & Activity Logs

### `TaskTimeLog`
Stopwatch tracking logs.
- **Fields**:
  - `startTime`: Timestamp when the timer was started.
  - `endTime`: Timestamp when the timer was stopped.
  - `duration`: Calculated duration in seconds.

### `WorkspaceMessage`
Broadcaster chat message.
- **Relations**:
  - `reactions`: Linked reactions.
- **Indices**: Index on `[workspaceId, createdAt]` optimizes message feed retrieval.

### `ChatMessageReaction`
Reactions to chat messages.
- **Constraint**: `@@unique([messageId, userId, emoji])` prevents duplicate reactions by the same user on a single message.

### `ActivityLog`
Audit logs database tracking.
- **Fields**:
  - `action`: Type of action (e.g. `TASK_STATUS_CHANGED`, `TASK_TIME_LOGGED`).
  - `metadata`: JSON object logging values (e.g. task name, elapsed seconds).
