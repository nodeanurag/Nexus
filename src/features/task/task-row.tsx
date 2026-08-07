"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, MessageSquare, Pencil, Trash2 } from "lucide-react";

import type { TaskPriority, TaskStatus } from "@/generated/prisma/client";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TASK_PRIORITY_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { deleteTaskAction } from "@/server/actions/task.actions";

import { TaskFormDialog, type TaskMember } from "./task-form-dialog";

const PRIORITY_BADGE: Record<TaskPriority, string> = {
  LOW: "bg-color-mist text-color-slate border border-color-fog",
  MEDIUM: "bg-[rgba(81,75,129,0.1)] text-color-aubergine border border-[rgba(81,75,129,0.2)]",
  HIGH: "bg-[rgba(123,104,238,0.1)] text-color-iris border border-[rgba(123,104,238,0.2)]",
  URGENT: "bg-color-ink text-color-pure-white border border-color-ink",
};

const PRIORITY_BORDER: Record<TaskPriority, string> = {
  LOW: "border-l-3 border-l-color-slate",
  MEDIUM: "border-l-3 border-l-color-aubergine",
  HIGH: "border-l-3 border-l-color-iris",
  URGENT: "border-l-3 border-l-color-ink",
};

const USER_GRADIENTS = [
  "from-color-iris to-color-aubergine",
  "from-color-charcoal to-color-ink",
  "from-color-slate to-color-ash",
  "from-color-aubergine to-color-ink",
  "from-color-iris to-color-ink",
];

function getUserGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % USER_GRADIENTS.length;
  return USER_GRADIENTS[index];
}

export type TaskRowData = {
  id: string;
  projectId: string;
  workspaceId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDateISO: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  commentCount: number;
};

export function TaskRow({
  task,
  members,
  canManage,
}: {
  task: TaskRowData;
  members: TaskMember[];
  canManage: boolean;
}) {
  const router = useRouter();
  const href = `/workspaces/${task.workspaceId}/projects/${task.projectId}/tasks/${task.id}`;
  const dueDate = task.dueDateISO
    ? new Date(task.dueDateISO).toLocaleDateString()
    : null;

  return (