"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import { ProjectFormDialog } from "./project-form-dialog";

export function CreateProjectButton({ workspaceId }: { workspaceId: string }) {
  return (
    <ProjectFormDialog
      workspaceId={workspaceId}
      trigger={({ onClick }) => (
        <Button onClick={onClick}>
          <Plus className="size-4" />
          New project
        </Button>
      )}
    />
  );
}
