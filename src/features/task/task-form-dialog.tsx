"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { TaskPriority, TaskStatus } from "@/generated/prisma/client";
import {
  TaskPriority as Priority,
  TaskStatus as Status,
} from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/lib/labels";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/validations/task";
import {
  createTaskAction,
  updateTaskAction,
} from "@/server/actions/task.actions";

const UNASSIGNED = "__unassigned__";

export type TaskMember = { id: string; name: string };

type TaskInitial = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null; // yyyy-mm-dd
  assigneeId: string | null;
};

export function TaskFormDialog({
  projectId,
  members,
  task,
  trigger,
}: {
  projectId: string;
  members: TaskMember[];
  task?: TaskInitial;
  trigger: (props: { onClick: () => void }) => ReactNode;
}) {
  const isEdit = Boolean(task);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? Status.TODO);
  const [priority, setPriority] = useState<TaskPriority>(
    task?.priority ?? Priority.MEDIUM,
  );
  const [dueDate, setDueDate] = useState(task?.dueDate ?? "");
  const [assignee, setAssignee] = useState(task?.assigneeId ?? UNASSIGNED);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>();

  const assigneeItems: Record<string, string> = {
    [UNASSIGNED]: "Unassigned",
    ...Object.fromEntries(members.map((member) => [member.id, member.name])),
  };

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrors(undefined);
    startTransition(async () => {
      const input = {
        title,
        description,
        status,
        priority,
        dueDate,
        assigneeId: assignee === UNASSIGNED ? "" : assignee,
      };
      const result =
        isEdit && task
          ? await updateTaskAction(task.id, input)
          : await createTaskAction(projectId, input);

      if (result.ok) {
        toast.success(isEdit ? "Task updated." : "Task created.");
        setOpen(false);
        router.refresh();
      } else {
        setErrors(result.fieldErrors);
        toast.error(result.error);
      }
    });
  }
