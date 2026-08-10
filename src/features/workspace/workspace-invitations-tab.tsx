"use client";

import { UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS } from "@/lib/labels";
import type { WorkspaceInvitationInfo } from "@/server/actions/invitation.actions";
import type { Role } from "@/generated/prisma/enums";

export function WorkspaceInvitationsTab({
  invitations,
  pending,
  onRevoke,
}: {
  invitations: WorkspaceInvitationInfo[];
  pending: boolean;
  onRevoke: (id: string, email: string) => void;
}) {
  if (invitations.length === 0) return null;

  return (
    <div className="space-y-3 pt-4 border-t border-border/40">
      <h3 className="text-sm font-bold text-foreground">Pending Invitations</h3>
      <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
        {invitations.map((inv) => (
          <div
            key={inv.id}
            className="flex items-center justify-between gap-3 p-2 rounded-xl border border-dashed border-border/40 bg-muted/5 hover:bg-muted/10 transition-colors"
          >
            <div className="min-w-0">
              <div className="text-xs font-bold text-foreground truncate">
                {inv.email}
              </div>
              <div className="text-[10px] text-muted-foreground truncate">
                Invited by {inv.invitedBy.name}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[9px] uppercase font-mono font-semibold px-2 py-0.5 rounded-md">
                {ROLE_LABELS[inv.role as Role]}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg border border-border/20 cursor-pointer"
                onClick={() => onRevoke(inv.id, inv.email)}
                disabled={pending}
                title="Revoke Invitation"
              >
                <UserX className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
