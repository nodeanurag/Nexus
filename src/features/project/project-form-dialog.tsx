"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { ProjectStatus } from "@/generated/prisma/client";
import { ProjectStatus as Status } from "@/generated/prisma/enums";
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
import { Textarea } from "@/components/ui/textarea";
import { PROJECT_STATUS_LABELS } from "@/lib/labels";
import { PROJECT_STATUSES } from "@/lib/validations/project";
import {
  createProjectAction,
  updateProjectAction,
} from "@/server/actions/project.actions";

type ProjectInitial = {
  id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  deadline: string | null; // yyyy-mm-dd
};

export function ProjectFormDialog({
  workspaceId,
  project,
  trigger,
}: {
  workspaceId: string;
  project?: ProjectInitial;
  trigger: (props: { onClick: () => void }) => ReactNode;
}) {
  const isEdit = Boolean(project);