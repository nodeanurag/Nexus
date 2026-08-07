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
