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

  return (
    <>
      {trigger({ onClick: () => setOpen(true) })}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{isEdit ? "Edit task" : "New task"}</DialogTitle>
              <DialogDescription>
                {isEdit
                  ? "Update the task details."
                  : "Add a task to this project."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="task-title">Title</Label>
                <Input
                  id="task-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Implement login form"
                  autoFocus
                />
                {errors?.title ? (
                  <p className="text-destructive text-sm">{errors.title[0]}</p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="task-description">Description</Label>
                <Textarea
                  id="task-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Add any details…"
                  rows={3}
                />
                {errors?.description ? (
                  <p className="text-destructive text-sm">
                    {errors.description[0]}
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="task-status">Status</Label>
                  <Select
                    value={status}
                    onValueChange={(value) => setStatus(value as TaskStatus)}
                    items={TASK_STATUS_LABELS}
                  >
                    <SelectTrigger id="task-status" className="w-full">
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
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="task-priority">Priority</Label>
                  <Select
                    value={priority}
                    onValueChange={(value) =>
                      setPriority(value as TaskPriority)
                    }
                    items={TASK_PRIORITY_LABELS}
                  >
                    <SelectTrigger id="task-priority" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_PRIORITIES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {TASK_PRIORITY_LABELS[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="task-assignee">Assignee</Label>
                  <Select
                    value={assignee}
                    onValueChange={(value) => setAssignee(value ?? UNASSIGNED)}
                    items={assigneeItems}
                  >
                    <SelectTrigger id="task-assignee" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="task-due">Due date</Label>
                  <Input
                    id="task-due"
                    type="date"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                  />
                  {errors?.dueDate ? (
                    <p className="text-destructive text-sm">
                      {errors.dueDate[0]}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending
                  ? "Saving…"
                  : isEdit
                    ? "Save changes"
                    : "Create task"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
