"use client";

import { Crown, UserX, Plus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROLE_LABELS } from "@/lib/labels";
import { Role } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";
import type { WorkspaceMemberInfo } from "@/server/actions/member.actions";

interface WorkspaceWithRole {
  id: string;
  name: string;
  ownerId: string;
  role: Role;
}

const USER_GRADIENTS = [
  "from-color-iris to-color-aubergine",
  "from-color-charcoal to-color-ink",
  "from-color-slate to-color-ash",
  "from-color-aubergine to-color-ink",
  "from-color-iris to-color-ink",
];

function getUserGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % USER_GRADIENTS.length;
  return USER_GRADIENTS[index];
}

export function WorkspaceMembersTab({
  activeWorkspace,
  members,
  membersLoading,
  currentUser,
  pending,
  inviteEmail,
  setInviteEmail,
  inviteRole,
  setInviteRole,
  onInvite,
  onRoleChange,
  onTransferOwnership,
  onRemoveMember,
}: {
  activeWorkspace: WorkspaceWithRole;
  members: WorkspaceMemberInfo[];
  membersLoading: boolean;
  currentUser: { id: string };
  pending: boolean;
  inviteEmail: string;
  setInviteEmail: (email: string) => void;
  inviteRole: string;
  setInviteRole: (role: string) => void;
  onInvite: (e: React.FormEvent) => void;
  onRoleChange: (memberId: string, role: Role) => void;
  onTransferOwnership: (targetMemberId: string, targetName: string) => void;
  onRemoveMember: (memberId: string, memberName: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Invite Form */}
      <form onSubmit={onInvite} className="space-y-2.5">
        <h3 className="text-sm font-bold text-foreground">Invite Member</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="email"
            placeholder="colleague@domain.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="h-10 bg-card border-border/80 rounded-xl flex-1"
            disabled={pending}
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="h-10 px-3 text-sm bg-card border border-border/80 rounded-xl outline-hidden focus:ring-1 focus:ring-primary/40 text-foreground/80 font-medium"
            disabled={pending}
          >
            <option value="ADMIN">Admin</option>
            <option value="MEMBER">Member</option>
            <option value="VIEWER">Viewer</option>
          </select>
          <Button type="submit" disabled={pending || !inviteEmail.trim()} className="h-10 rounded-xl font-semibold">
            <Plus className="size-4 mr-1" />
            Add
          </Button>
        </div>
      </form>

      <div className="h-px bg-border/60" />

      {/* Directory List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-foreground">Team Directory</h3>
        {membersLoading ? (
          <div className="text-xs text-muted-foreground py-4 text-center">
            Loading team directory...
          </div>
        ) : members.length === 0 ? (
          <div className="text-xs text-muted-foreground py-4 text-center">
            No members in this workspace
          </div>
        ) : (
          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
            {members.map((m) => {
              const isSelf = m.userId === currentUser.id;
              const isTargetOwner = m.role === "OWNER";
              const isCurrentOwner = activeWorkspace.role === "OWNER";
              const displayName = m.user.name || m.user.email || "User";

              return (
                <div
                  key={m.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-xl border border-border/30 hover:bg-muted/15 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="size-8">
                      <AvatarFallback
                        className={cn(
                          "text-[9px] font-bold text-white bg-gradient-to-br flex items-center justify-center",
                          getUserGradient(displayName)
                        )}
                      >
                        {displayName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate flex items-center gap-1.5">
                        <span>{displayName}</span>
                        {isSelf && <span className="text-[10px] text-muted-foreground font-normal">(you)</span>}
                        {isTargetOwner && <Crown className="size-3 text-amber-500 fill-amber-500/10 shrink-0" />}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {m.user.email}
                      </div>
                    </div>
                  </div>

                  {/* Member Operations */}
                  <div className="flex items-center gap-2">
                    {/* Change Role Select */}
                    {isCurrentOwner && !isTargetOwner ? (
                      <select
                        value={m.role}
                        onChange={(e) => onRoleChange(m.id, e.target.value as Role)}
                        className="h-8 px-2 text-[11px] bg-card border border-border/80 rounded-lg outline-hidden text-foreground/80 font-medium"
                        disabled={pending}
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="MEMBER">Member</option>
                        <option value="VIEWER">Viewer</option>
                      </select>
                    ) : (
                      <Badge variant="secondary" className="text-[9px] uppercase font-mono font-semibold px-2 py-0.5 rounded-md">
                        {ROLE_LABELS[m.role as Role]}
                      </Badge>
                    )}

                    {/* Transfer Ownership */}
                    {isCurrentOwner && !isTargetOwner && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-[11px] font-bold rounded-lg border-amber-500/20 text-amber-600 hover:bg-amber-500/5 cursor-pointer"
                        onClick={() => onTransferOwnership(m.id, displayName)}
                        disabled={pending}
                      >
                        Make Owner
                      </Button>
                    )}

                    {/* Remove Member */}
                    {((isCurrentOwner && !isTargetOwner) ||
                      (activeWorkspace.role === "ADMIN" &&
                        m.role !== "OWNER" &&
                        m.role !== "ADMIN")) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg border border-border/20 cursor-pointer"
                        onClick={() => onRemoveMember(m.id, displayName)}
                        disabled={pending}
                        title="Remove Member"
                      >
                        <UserX className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
