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
