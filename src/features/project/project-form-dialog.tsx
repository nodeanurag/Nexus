"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { ProjectStatus } from "@/generated/prisma/client";
import { ProjectStatus as Status } from "@/generated/prisma/enums";
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
import { PROJECT_STATUS_LABELS } from "@/lib/labels";
import { PROJECT_STATUSES } from "@/lib/validations/project";
import {
  createProjectAction,
  updateProjectAction,
} from "@/server/actions/project.actions";

type ProjectInitial = {
  id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  deadline: string | null; // yyyy-mm-dd
};

export function ProjectFormDialog({
  workspaceId,
  project,
  trigger,
}: {
  workspaceId: string;
  project?: ProjectInitial;
  trigger: (props: { onClick: () => void }) => ReactNode;
}) {
  const isEdit = Boolean(project);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState(project?.title ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [status, setStatus] = useState<ProjectStatus>(
    project?.status ?? Status.ACTIVE,
  );
  const [deadline, setDeadline] = useState(project?.deadline ?? "");
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrors(undefined);
    startTransition(async () => {
      const input = { title, description, status, deadline };
      const result =
        isEdit && project
          ? await updateProjectAction(project.id, input)
          : await createProjectAction(workspaceId, input);

      if (result.ok) {
        toast.success(isEdit ? "Project updated." : "Project created.");
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
              <DialogTitle>
                {isEdit ? "Edit project" : "New project"}
              </DialogTitle>
              <DialogDescription>
                {isEdit
                  ? "Update the project details."
                  : "Create a project to organise tasks."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="project-title">Title</Label>
                <Input
                  id="project-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Website redesign"
                  autoFocus
                />
                {errors?.title ? (
                  <p className="text-destructive text-sm">{errors.title[0]}</p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="project-description">Description</Label>
                <Textarea
                  id="project-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="What is this project about?"
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
                  <Label htmlFor="project-status">Status</Label>
                  <Select
                    value={status}
                    onValueChange={(value) =>
                      setStatus(value as ProjectStatus)
                    }
                    items={PROJECT_STATUS_LABELS}
                  >
                    <SelectTrigger id="project-status" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_STATUSES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {PROJECT_STATUS_LABELS[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="project-deadline">Deadline</Label>
                  <Input
                    id="project-deadline"
                    type="date"
                    value={deadline}
                    onChange={(event) => setDeadline(event.target.value)}
                  />
                  {errors?.deadline ? (
                    <p className="text-destructive text-sm">
                      {errors.deadline[0]}
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
                    : "Create project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
