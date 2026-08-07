"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import confetti from "canvas-confetti";
import type { TaskStatus } from "@/generated/prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TASK_STATUS_LABELS } from "@/lib/labels";
import { TASK_STATUSES } from "@/lib/validations/task";
import { updateTaskStatusAction } from "@/server/actions/task.actions";

export function TaskStatusSelect({
  taskId,
  currentStatus,
}: {
  taskId: string;
  currentStatus: TaskStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<TaskStatus>(currentStatus);
  const [pending, startTransition] = useTransition();

  function changeStatus(value: string | null) {
    if (!value) return;
    const next = value as TaskStatus;
    if (next === status) return;
    const previous = status;
    setStatus(next);
    startTransition(async () => {
      const result = await updateTaskStatusAction(taskId, { status: next });
      if (result.ok) {
        toast.success("Status updated.");
        if (next === "DONE" && previous !== "DONE") {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.7 },
            colors: ["#8B5CF6", "#A78BFA", "#6366F1", "#3B82F6", "#4F46E5"]
          });
        }
        router.refresh();
      } else {
        toast.error(result.error);
        setStatus(previous);
      }
    });
  }

  return (
    <Select
      value={status}
      onValueChange={changeStatus}
      items={TASK_STATUS_LABELS}
      disabled={pending}
    >
      <SelectTrigger size="sm" className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {TASK_STATUSES.map((value) => (
          <SelectItem key={value} value={value}>
            {TASK_STATUS_LABELS[value]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
