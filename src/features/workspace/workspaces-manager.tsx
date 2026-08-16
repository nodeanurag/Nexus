"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  FolderKanban,
  Search,
  Users,
  Building2,
  Trash2,
  LogOut,
  Sparkles,
  Settings2,
  Plus,
  Crown,
  UserX,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CreateWorkspaceDialog } from "@/features/workspace/create-workspace-dialog";

import { WorkspaceManageList } from "./workspace-manage-list";
import { cn } from "@/lib/utils";
import { WorkspaceSettingsTabs } from "./workspace-settings-tabs";
import { WorkspaceMembersTab } from "./workspace-members-tab";
import { WorkspaceInvitationsTab } from "./workspace-invitations-tab";

import {
  updateWorkspaceAction,
  deleteWorkspaceAction,
  leaveWorkspaceAction,
  transferWorkspaceOwnershipAction,
} from "@/server/actions/workspace.actions";
import {
  listMembersAction,
  addMemberAction,
  updateMemberRoleAction,
  removeMemberAction,
  type WorkspaceMemberInfo,
} from "@/server/actions/member.actions";
import {
  inviteMemberAction,
  revokeInvitationAction,
  listInvitationsAction,
  type WorkspaceInvitationInfo,
} from "@/server/actions/invitation.actions";
import { Role } from "@/generated/prisma/enums";

interface WorkspaceWithRole {
  id: string;
  name: string;
  ownerId: string;
  role: Role;
  _count: {
    projects: number;
    members: number;
  };
}

export function WorkspacesManager({
  initialWorkspaces,
  user,
}: {
  initialWorkspaces: WorkspaceWithRole[];
  user: { id: string; name?: string | null; email?: string | null };
}) {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<WorkspaceWithRole[]>(initialWorkspaces);
  const [search, setSearch] = useState("");
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceWithRole | null>(null);
  const [members, setMembers] = useState<WorkspaceMemberInfo[]>([]);
  const [invitations, setInvitations] = useState<WorkspaceInvitationInfo[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "members">("general");

  // State fields for management actions
  const [renameName, setRenameName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");

  const [pending, startTransition] = useTransition();

  // Load members and invitations whenever the active workspace changes
  useEffect(() => {
    if (activeWorkspace) {
      // Defer state update to next microtask to avoid cascading render warning in useEffect body
      Promise.resolve().then(() => {
        setMembersLoading(true);
      });
      Promise.all([
        listMembersAction(activeWorkspace.id),
        listInvitationsAction(activeWorkspace.id),
      ]).then(([mRes, iRes]) => {
        if (mRes.ok && mRes.data) {
          setMembers(mRes.data);
        } else {
          toast.error("Failed to load workspace members.");
        }
        if (iRes.ok && iRes.data) {
          setInvitations(iRes.data);
        } else {
          toast.error("Failed to load pending invitations.");
        }
        setMembersLoading(false);
      });
    }
  }, [activeWorkspace]);

  const filtered = workspaces.filter((ws) =>
    ws.name.toLowerCase().includes(search.toLowerCase())
  );

  function handleRename(e: React.FormEvent) {
    e.preventDefault();
    if (!activeWorkspace || !renameName.trim()) return;

    startTransition(async () => {
      const res = await updateWorkspaceAction(activeWorkspace.id, { name: renameName });
      if (res.ok) {
        toast.success("Workspace renamed successfully.");
        setWorkspaces((prev) =>
          prev.map((ws) => (ws.id === activeWorkspace.id ? { ...ws, name: renameName } : ws))
        );
        setActiveWorkspace((prev) => (prev ? { ...prev, name: renameName } : null));
        router.refresh();
      } else {
        toast.error(res.error || "Failed to rename workspace.");
      }
    });
  }

  function handleDelete() {
    if (!activeWorkspace) return;
    if (!confirm(`Are you absolutely sure you want to delete "${activeWorkspace.name}"?`)) return;

    startTransition(async () => {
      const res = await deleteWorkspaceAction(activeWorkspace.id);
      if (res.ok) {
        toast.success("Workspace deleted successfully.");
        setWorkspaces((prev) => prev.filter((ws) => ws.id !== activeWorkspace.id));
        setActiveWorkspace(null);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to delete workspace.");
      }
    });
  }

  function handleLeave() {
    if (!activeWorkspace) return;
    if (!confirm(`Are you sure you want to leave "${activeWorkspace.name}"?`)) return;

    startTransition(async () => {
      const res = await leaveWorkspaceAction(activeWorkspace.id);
      if (res.ok) {
        toast.success("You have left the workspace.");
        setWorkspaces((prev) => prev.filter((ws) => ws.id !== activeWorkspace.id));
        setActiveWorkspace(null);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to leave workspace.");
      }
    });
  }

  const triggerLeaveForWorkspace = (ws: WorkspaceWithRole) => {
    setActiveWorkspace(ws);
    // Defer confirmation popup to next tick so state reflects active workspace context
    setTimeout(() => {
      handleLeave();
    }, 0);
  };

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!activeWorkspace || !inviteEmail.trim()) return;

    startTransition(async () => {
      const res = await inviteMemberAction(activeWorkspace.id, {
        email: inviteEmail,
        role: inviteRole as Role,
      });
      if (res.ok) {
        toast.success("Invitation sent successfully.");
        setInviteEmail("");
        // Reload members & invitations
        const [freshMembers, freshInvites] = await Promise.all([
          listMembersAction(activeWorkspace.id),
          listInvitationsAction(activeWorkspace.id),
        ]);
        if (freshMembers.ok && freshMembers.data) {
          setMembers(freshMembers.data);
        }
        if (freshInvites.ok && freshInvites.data) {
          setInvitations(freshInvites.data);
        }
      } else {
        toast.error(res.error || "Failed to send invitation.");
      }
    });
  }

  function handleRevoke(invitationId: string, email: string) {
    if (!activeWorkspace) return;
    if (!confirm(`Are you sure you want to revoke the invitation for "${email}"?`)) return;

    startTransition(async () => {
      const res = await revokeInvitationAction(activeWorkspace.id, invitationId);
      if (res.ok) {
        toast.success("Invitation revoked successfully.");
        setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
      } else {
        toast.error(res.error || "Failed to revoke invitation.");
      }
    });
  }

  function handleRoleChange(memberId: string, role: Role) {
    if (!activeWorkspace) return;

    startTransition(async () => {
      const res = await updateMemberRoleAction(activeWorkspace.id, memberId, { role });
      if (res.ok) {
        toast.success("Member role updated.");
        setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role } : m)));
      } else {
        toast.error(res.error || "Failed to update role.");
      }
    });
  }

  function handleTransferOwnership(targetMemberId: string, targetName: string) {
    if (!activeWorkspace) return;
    if (
      !confirm(
        `Are you sure you want to transfer ownership to ${targetName}? You will be demoted to Admin.`
      )
    )
      return;

    startTransition(async () => {
      const res = await transferWorkspaceOwnershipAction(activeWorkspace.id, targetMemberId);
      if (res.ok) {
        toast.success(`Ownership transferred to ${targetName}.`);
        setWorkspaces((prev) =>
          prev.map((ws) =>
            ws.id === activeWorkspace.id ? { ...ws, role: "ADMIN", ownerId: targetMemberId } : ws
          )
        );
        setActiveWorkspace(null);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to transfer ownership.");
      }
    });
  }

  function handleRemoveMember(memberId: string, memberName: string) {
    if (!activeWorkspace) return;
    if (!confirm(`Are you sure you want to remove ${memberName} from this workspace?`)) return;

    startTransition(async () => {
      const res = await removeMemberAction(activeWorkspace.id, memberId);
      if (res.ok) {
        toast.success(`${memberName} removed from workspace.`);
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
      } else {
        toast.error(res.error || "Failed to remove member.");
      }
    });
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <header className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center rounded-3xl border border-border/40 bg-gradient-to-r from-violet-500/5 via-color-iris/5 to-color-aubergine/5 backdrop-blur-xl p-6 sm:p-8 shadow-xs overflow-hidden transition-all hover:border-border/60 group">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-color-iris to-color-aubergine" />
        <div className="pl-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-color-iris/10 text-color-iris text-[10px] font-extrabold tracking-wider uppercase mb-2.5 select-none">
            <Sparkles className="size-3" />
            Workspace Switchboard
          </span>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl text-foreground">Workspace Hub</h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm font-semibold">
            Create new workspaces or manage configuration, settings, and team access.
          </p>
        </div>
        <div className="shrink-0 z-10">
          <CreateWorkspaceDialog />
        </div>
      </header>

      {/* Search and Filters */}
      <div className="relative max-w-sm pt-2">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/75" />
        <Input
          type="text"
          placeholder="Search workspaces..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9.5 h-10 bg-card border-border/60 focus-visible:ring-color-iris/30 transition-all rounded-xl font-semibold text-xs"
        />
      </div>

      {/* Grid of Workspaces */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/20 py-16 text-center shadow-xs">
          <p className="text-muted-foreground text-xs font-semibold">
            {search ? "No workspaces found matching your query." : "No workspaces found."}
          </p>
        </div>
      ) : (
        <WorkspaceManageList
          workspaces={filtered}
          onManage={(workspace) => {
            setActiveWorkspace(workspace);
            setRenameName(workspace.name);
            setActiveTab("general");
          }}
          onLeave={triggerLeaveForWorkspace}
        />
      )}

      {/* Settings / Manage Workspace Dialog */}
      {activeWorkspace && (
        <Dialog open={true} onOpenChange={(open) => !open && setActiveWorkspace(null)}>
          <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Manage Workspace</DialogTitle>
              <DialogDescription>
                Configure settings and membership access for &quot;{activeWorkspace.name}&quot;
              </DialogDescription>
            </DialogHeader>

            {/* Tab Headers */}
            <div className="flex border-b border-border/60 mb-4">
              <button
                onClick={() => setActiveTab("general")}
                className={cn(
                  "px-4 py-2 text-sm font-semibold border-b-2 transition-all cursor-pointer",
                  activeTab === "general"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                General Settings
              </button>
              <button
                onClick={() => setActiveTab("members")}
                className={cn(
                  "px-4 py-2 text-sm font-semibold border-b-2 transition-all cursor-pointer",
                  activeTab === "members"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                Team Access ({members.length})
              </button>
            </div>

            {/* General Tab */}
            {activeTab === "general" && (
              <WorkspaceSettingsTabs
                activeWorkspace={activeWorkspace}
                renameName={renameName}
                setRenameName={setRenameName}
                pending={pending}
                onRename={handleRename}
                onDelete={handleDelete}
                onLeave={handleLeave}
              />
            )}

            {/* Members Tab */}
            {activeTab === "members" && (
              <div className="space-y-6">
                <WorkspaceMembersTab
                  activeWorkspace={activeWorkspace}
                  members={members}
                  membersLoading={membersLoading}
                  currentUser={user}
                  pending={pending}
                  inviteEmail={inviteEmail}
                  setInviteEmail={setInviteEmail}
                  inviteRole={inviteRole}
                  setInviteRole={setInviteRole}
                  onInvite={handleInvite}
                  onRoleChange={handleRoleChange}
                  onTransferOwnership={handleTransferOwnership}
                  onRemoveMember={handleRemoveMember}
                />
                
                <WorkspaceInvitationsTab
                  invitations={invitations}
                  pending={pending}
                  onRevoke={handleRevoke}
                />
              </div>
            )}

            <DialogFooter className="mt-4 border-t border-border/40 pt-4">
              <Button onClick={() => setActiveWorkspace(null)} className="h-9 rounded-xl font-semibold">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
