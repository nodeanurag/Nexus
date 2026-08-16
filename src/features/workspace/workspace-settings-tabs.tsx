"use client";

import { Trash2, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Role } from "@/generated/prisma/enums";

interface WorkspaceWithRole {
  id: string;
  name: string;
  ownerId: string;
  role: Role;
}

export function WorkspaceSettingsTabs({
  activeWorkspace,
  renameName,
  setRenameName,
  pending,
  onRename,
  onDelete,
  onLeave,
}: {
  activeWorkspace: WorkspaceWithRole;
  renameName: string;
  setRenameName: (name: string) => void;
  pending: boolean;
  onRename: (e: React.FormEvent) => void;
  onDelete: () => void;
  onLeave: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Rename */}
      <form onSubmit={onRename} className="space-y-2.5">
        <h3 className="text-sm font-bold text-foreground">Rename Workspace</h3>
        <div className="flex gap-2">
          <Input
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            placeholder="Workspace Name"
            className="h-10 bg-card border-border/80 rounded-xl"
            disabled={pending}
          />
          <Button type="submit" disabled={pending || !renameName.trim()} className="h-10 rounded-xl font-semibold">
            Save
          </Button>
        </div>
      </form>

      <div className="h-px bg-border/60" />

      {/* Danger zone */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-destructive">Danger zone</h3>
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h4 className="text-xs font-bold text-foreground">
              {activeWorkspace.role === "OWNER"
                ? "Delete this workspace"
                : "Leave this workspace"}
            </h4>
            <p className="text-[11px] text-muted-foreground mt-1 max-w-sm">
              {activeWorkspace.role === "OWNER"
                ? "Deleting is permanent and deletes all projects, tasks, comments, and activity history."
                : "You will lose access to all projects, tasks, and data in this workspace."}
            </p>
          </div>
          {activeWorkspace.role === "OWNER" ? (
            <Button
              type="button"
              variant="destructive"
              onClick={onDelete}
              disabled={pending}
              className="text-xs h-9 rounded-xl font-semibold shrink-0"
            >
              <Trash2 className="size-3.5 mr-1" />
              Delete Workspace
            </Button>
          ) : (
            <Button
              type="button"
              variant="destructive"
              onClick={onLeave}
              disabled={pending}
              className="text-xs h-9 rounded-xl font-semibold shrink-0"
            >
              <LogOut className="size-3.5 mr-1" />
              Leave Workspace
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
