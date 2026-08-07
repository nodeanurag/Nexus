"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import { TaskFormDialog, type TaskMember } from "./task-form-dialog";

export function CreateTaskButton({
  projectId,
  members,
}: {
  projectId: string;
  members: TaskMember[];
}) {
  return (
    <TaskFormDialog
      projectId={projectId}
      members={members}
      trigger={({ onClick }) => (
        <Button onClick={onClick}>
          <Plus className="size-4" />
          New task
        </Button>
      )}
    />
  );
}
