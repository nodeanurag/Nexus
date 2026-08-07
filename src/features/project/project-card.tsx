"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, ListChecks, Pencil, Trash2 } from "lucide-react";

import type { ProjectStatus } from "@/generated/prisma/client";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PROJECT_STATUS_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { deleteProjectAction } from "@/server/actions/project.actions";

import { ProjectFormDialog } from "./project-form-dialog";

const STATUS_BADGE: Record<ProjectStatus, string> = {
  ACTIVE: "bg-[rgba(123,104,238,0.1)] text-color-iris border border-[rgba(123,104,238,0.2)]",
  COMPLETED: "bg-color-ink text-color-pure-white border border-color-ink",
  ARCHIVED: "bg-color-mist text-color-slate border border-color-fog",
};

export type ProjectCardData = {
  id: string;
  workspaceId: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  deadlineISO: string | null;
  taskCount: number;
};

export function ProjectCard({
  project,
  canManage,
}: {
  project: ProjectCardData;
  canManage: boolean;
}) {
  const router = useRouter();
  const href = `/workspaces/${project.workspaceId}/projects/${project.id}`;
  const deadline = project.deadlineISO
    ? new Date(project.deadlineISO).toLocaleDateString()
    : null;

  return (
    <Card className="group h-full border-border/60 bg-card/80 shadow-xs backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg">
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
        <div className="min-w-0">
          <CardTitle className="truncate text-lg font-semibold group-hover:text-primary transition-colors">
            <Link href={href} className="hover:underline">
              {project.title}
            </Link>
          </CardTitle>
          <Badge
            variant="secondary"
            className={cn("mt-2.5 text-xs font-semibold px-2.5 py-0.5", STATUS_BADGE[project.status])}
          >
            {PROJECT_STATUS_LABELS[project.status]}
          </Badge>
        </div>
        {canManage ? (
          <div className="flex shrink-0 gap-1">
            <ProjectFormDialog
              workspaceId={project.workspaceId}
              project={{
                id: project.id,
                title: project.title,
                description: project.description,
                status: project.status,
                deadline: project.deadlineISO
                  ? project.deadlineISO.slice(0, 10)
                  : "",
              }}
              trigger={({ onClick }) => (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onClick}
                  aria-label="Edit project"
                >
                  <Pencil className="size-4" />
                </Button>
              )}
            />
            <ConfirmDialog
              title="Delete project?"
              description={`"${project.title}" and all of its tasks will be permanently deleted. This cannot be undone.`}
              confirmLabel="Delete project"
              successMessage="Project deleted."
              onConfirm={async () => {
                const result = await deleteProjectAction(project.id);
                if (result.ok) router.refresh();
                return result;
              }}
              trigger={({ onClick }) => (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onClick}
                  aria-label="Delete project"
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            />
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {project.description ? (
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {project.description}
          </p>
        ) : null}
        <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <ListChecks className="size-4" />
            {project.taskCount} tasks
          </span>
          {deadline ? (
            <span className="flex items-center gap-1.5">
              <CalendarClock className="size-4" />
              {deadline}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
