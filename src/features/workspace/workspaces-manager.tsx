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
