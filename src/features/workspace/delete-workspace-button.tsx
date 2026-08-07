"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { deleteWorkspaceAction } from "@/server/actions/workspace.actions";

export function DeleteWorkspaceButton({
  workspaceId,
  workspaceName,
}: {
  workspaceId: string;
  workspaceName: string;
}) {
  const router = useRouter();

  return (
    <ConfirmDialog
      title="Delete workspace?"
      description={`"${workspaceName}" and all of its projects, tasks, comments, and activity will be permanently deleted. This cannot be undone.`}
      confirmLabel="Delete workspace"
      successMessage="Workspace deleted."
      onConfirm={async () => {
        const result = await deleteWorkspaceAction(workspaceId);
        if (result.ok) router.push("/dashboard");
        return result;
      }}
      trigger={({ onClick }) => (
        <Button variant="destructive" onClick={onClick}>
          <Trash2 className="size-4" />
          Delete workspace
        </Button>
      )}
    />
  );
}
