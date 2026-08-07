"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateWorkspaceAction } from "@/server/actions/workspace.actions";

export function WorkspaceSettingsForm({
  workspaceId,
  initialName,
}: {
  workspaceId: string;
  initialName: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>();
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrors(undefined);
    startTransition(async () => {
      const result = await updateWorkspaceAction(workspaceId, { name });
      if (result.ok) {
        toast.success("Workspace updated.");
        router.refresh();
      } else {
        setErrors(result.fieldErrors);
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="workspace-name">Workspace name</Label>
        <Input
          id="workspace-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="max-w-sm"
        />
        {errors?.name ? (
          <p className="text-destructive text-sm">{errors.name[0]}</p>
        ) : null}
      </div>
      <Button type="submit" disabled={pending || name.trim() === initialName}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
