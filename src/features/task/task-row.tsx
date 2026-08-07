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
    <div className={cn(
      "flex items-center justify-between gap-4 p-4 hover:bg-muted/40 transition-all duration-200",
      PRIORITY_BORDER[task.priority]
    )}>
      <div className="min-w-0 space-y-1.5">
        <Link href={href} className="block truncate font-bold text-sm text-foreground/95 hover:text-primary transition-colors hover:underline">
          {task.title}
        </Link>
        <div className="text-muted-foreground flex flex-wrap items-center gap-3.5 text-xs font-semibold">
          <Badge
            variant="secondary"
            className={cn("text-[9px] font-bold px-2 py-0.5 shadow-3xs", PRIORITY_BADGE[task.priority])}
          >
            {TASK_PRIORITY_LABELS[task.priority]}
          </Badge>
          {task.assigneeName ? (
            <span className="flex items-center gap-1.5 truncate">
              <span className={cn(
                "flex size-4.5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-[8px] text-white shadow-3xs",
                getUserGradient(task.assigneeName)
              )}>
                {task.assigneeName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </span>
              <span className="text-foreground/80">{task.assigneeName}</span>
            </span>
          ) : (
            <span className="italic opacity-60">Unassigned</span>
          )}
          {dueDate ? (
            <span className="flex items-center gap-1 text-foreground/75">
              <CalendarClock className="size-3.5 text-primary/80" />
              {dueDate}
            </span>
          ) : null}
          {task.commentCount > 0 ? (
            <span className="flex items-center gap-1 text-foreground/75">
              <MessageSquare className="size-3.5 text-primary/80" />
              {task.commentCount}
            </span>
          ) : null}
        </div>
      </div>

      {canManage ? (
        <div className="flex shrink-0 gap-1">
          <TaskFormDialog
            projectId={task.projectId}
            members={members}
            task={{
              id: task.id,
              title: task.title,
              description: task.description,
              status: task.status,
              priority: task.priority,
              dueDate: task.dueDateISO ? task.dueDateISO.slice(0, 10) : "",
              assigneeId: task.assigneeId,
            }}
            trigger={({ onClick }) => (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onClick}
                aria-label="Edit task"
              >
                <Pencil className="size-4" />
              </Button>
            )}
          />
          <ConfirmDialog
            title="Delete task?"
            description={`"${task.title}" and all of its comments will be permanently deleted. This cannot be undone.`}
            confirmLabel="Delete task"
            successMessage="Task deleted."
            onConfirm={async () => {
              const result = await deleteTaskAction(task.id);
              if (result.ok) router.refresh();
              return result;
            }}
            trigger={({ onClick }) => (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onClick}
                aria-label="Delete task"
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          />
        </div>
      ) : null}
    </div>
  );
}
