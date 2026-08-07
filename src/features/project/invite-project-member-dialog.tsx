"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

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
import { ROLE_LABELS } from "@/lib/labels";
import { ASSIGNABLE_ROLES } from "@/lib/validations/workspace";
import { Role } from "@/generated/prisma/enums";
import { inviteMemberAction } from "@/server/actions/invitation.actions";

export function InviteProjectMemberDialog({
  workspaceId,
  projectId,
}: {
  workspaceId: string;
  projectId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>(Role.MEMBER);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrors(undefined);
    startTransition(async () => {
      const result = await inviteMemberAction(workspaceId, {
        email,
        role,
        projectId,
      });

      if (result.ok) {
        toast.success("Invitation sent successfully.");
        setEmail("");
        setRole(Role.MEMBER);
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
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-10 rounded-xl font-semibold border-border/80"
      >
        <UserPlus className="size-4 mr-2" />
        Invite Teammate
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[420px] p-6 rounded-2xl bg-card border border-border/80 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Invite Teammate</DialogTitle>
              <DialogDescription>
                Invite a colleague to this project and workspace.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="colleague@example.com"
                  autoFocus
                  required
                />
                {errors?.email ? (
                  <p className="text-destructive text-sm">{errors.email[0]}</p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="invite-role">Workspace Role</Label>
                <Select
                  value={role}
                  onValueChange={(value) => setRole(value as Role)}
                  items={ROLE_LABELS}
                >
                  <SelectTrigger id="invite-role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSIGNABLE_ROLES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {ROLE_LABELS[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-2 border-t border-border/40">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="rounded-xl h-10"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending} className="rounded-xl h-10">
                {pending ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
