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
} from "@/server/actions/member.actions";
import {
  inviteMemberAction,
  revokeInvitationAction,
  listInvitationsAction,
} from "@/server/actions/invitation.actions";
import { ROLE_LABELS } from "@/lib/labels";
import { Role } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

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


const GRADIENTS = [
  "from-color-iris to-color-aubergine",
  "from-color-charcoal to-color-ink",
  "from-color-slate to-color-ash",
  "from-color-aubergine to-color-ink",
  "from-color-iris to-color-ink",
  "from-color-slate to-color-ink",
];

function getGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENTS.length;
  return GRADIENTS[index];
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
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
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
      setMembersLoading(true);
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

  function handleRoleChange(memberId: string, role: string) {
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
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="mb-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-center rounded-2xl border border-color-fog bg-color-mist/40 p-6 sm:p-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-color-mist border border-color-fog px-3 py-1 text-xs font-semibold font-mono text-color-iris">
            <Sparkles className="size-3.5 text-color-iris" />
            <span>Workspace Switchboard</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-color-ink">
            Workspace Hub
          </h1>
          <p className="text-color-slate text-sm sm:text-base">
            Create new workspaces or manage configuration, settings, and team access.
          </p>
        </div>
        <div className="shrink-0">
          <CreateWorkspaceDialog />
        </div>
      </div>

      {/* Search and Filters */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70" />
        <Input
          type="text"
          placeholder="Search workspaces..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-10 bg-card/65 backdrop-blur-md border-border/80 focus-visible:ring-primary/45 focus-visible:border-primary/50 transition-all rounded-xl"
        />
      </div>

      {/* Grid of Workspaces */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/30 py-16 text-center shadow-xs">
          <p className="text-muted-foreground text-sm font-medium">
            {search ? "No workspaces found matching your query." : "No workspaces found."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in duration-300">
          {filtered.map((workspace) => {
            const gradient = getGradient(workspace.name);
            const isOwner = workspace.role === "OWNER";
            const isAdmin = workspace.role === "ADMIN";
            const canManage = isOwner || isAdmin;

            return (
              <Card
                key={workspace.id}
                className="h-full border-border/50 bg-card shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md"
              >
                <CardHeader className="flex flex-row items-start justify-between gap-2 pb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br font-bold text-white shadow-sm text-sm",
                        gradient
                      )}
                    >
                      {workspace.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="truncate text-base font-bold text-foreground">
                        {workspace.name}
                      </CardTitle>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "mt-1 text-[9px] font-semibold tracking-wider uppercase font-mono px-2 py-0.5 rounded-md",
                          isOwner
                            ? "bg-color-mist text-color-iris border border-color-fog"
                            : "bg-color-mist text-color-slate border border-color-fog"
                        )}
                      >
                        {ROLE_LABELS[workspace.role]}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">