"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, ListChecks, Pencil, Trash2, MoreVertical, ArrowRight } from "lucide-react";

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PROJECT_STATUS_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { deleteProjectAction } from "@/server/actions/project.actions";

import { ProjectFormDialog } from "./project-form-dialog";

const STATUS_BADGE: Record<ProjectStatus, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/25",
  COMPLETED: "bg-blue-500/10 text-blue-600 border border-blue-500/25",
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
  progress: number;
  createdByInitials: string;
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
    ? new Date(project.deadlineISO).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("[role='menuitem']") ||
      target.closest("[role='dialog']") ||
      target.closest("[data-state]")
    ) {
      return;
    }
    router.push(href);
  };

  const STRIPE_COLOR = {
    ACTIVE: "bg-gradient-to-r from-color-iris to-color-aubergine",
    COMPLETED: "bg-gradient-to-r from-emerald-500 to-teal-500",
    ARCHIVED: "bg-gradient-to-r from-color-slate to-color-ash",
  };

  return (
    <Card 
      onClick={handleCardClick}
      className="group h-full border border-border/50 bg-card/45 backdrop-blur-xl shadow-3xs hover:shadow-2xs transition-all duration-300 hover:-translate-y-0.5 hover:border-border/70 cursor-pointer select-none relative overflow-hidden flex flex-col justify-between rounded-2xl"
    >
      {/* Top status stripe */}
      <div className={cn("absolute top-0 left-0 w-full h-[3px] transition-all", STRIPE_COLOR[project.status])} />

      <CardHeader className="flex flex-row items-center justify-between gap-2 pt-6 pb-3 px-5">
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Rounded code tag icon */}
          <div className="flex size-11 items-center justify-center rounded-xl bg-color-iris/10 text-color-iris shrink-0 font-bold font-mono text-sm shadow-3xs">
            {"</>"}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="truncate text-base font-bold group-hover:text-color-iris transition-colors leading-snug">
                <Link href={href} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                  {project.title}
                </Link>
              </CardTitle>
              <Badge
                variant="secondary"
                className={cn("text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit select-none", STATUS_BADGE[project.status])}
              >
                <span className={cn("size-1 rounded-full",
                  project.status === "ACTIVE" ? "bg-emerald-500 animate-pulse" :
                  project.status === "COMPLETED" ? "bg-blue-500" : "bg-color-slate"
                )} />
                {PROJECT_STATUS_LABELS[project.status]}
              </Badge>
            </div>
          </div>
        </div>

        {canManage ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground/80 transition-colors cursor-pointer select-none"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl border-border/55 bg-background/95 backdrop-blur-md">
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
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onClick();
                    }}
                    className="rounded-lg font-semibold text-xs cursor-pointer gap-2"
                  >
                    <Pencil className="size-3.5" />
                    Edit project
                  </DropdownMenuItem>
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
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onClick();
                    }}
                    className="rounded-lg font-semibold text-xs text-destructive hover:text-destructive cursor-pointer gap-2"
                  >
                    <Trash2 className="size-3.5" />
                    Delete project
                  </DropdownMenuItem>
                )}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </CardHeader>
      
      <CardContent className="space-y-4 px-5 pb-5 pt-1 flex-1 flex flex-col justify-between">
        {project.description ? (
          <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed font-semibold">
            {project.description}
          </p>
        ) : (
          <div className="h-4" />
        )}

        {/* Task and Deadline Chips */}
        <div className="text-muted-foreground flex flex-wrap gap-2 text-[10px] font-bold pt-1">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/65 dark:bg-muted/15 border border-border/30">
            <ListChecks className="size-3.5 text-color-iris" />
            {project.taskCount} {project.taskCount === 1 ? "task" : "tasks"}
          </span>
          {deadline ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/65 dark:bg-muted/15 border border-border/30" suppressHydrationWarning>
              <CalendarClock className="size-3.5 text-color-iris" />
              {deadline}
            </span>
          ) : null}
        </div>

        {/* Progress bar matching mockup */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between text-[10px] font-bold">
            <span className="text-muted-foreground">Progress</span>
            <span className="text-foreground">{project.progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-muted dark:bg-muted/15 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-color-iris to-color-aubergine rounded-full transition-all duration-500" 
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        {/* Footer: User initials and Open Button */}
        <div className="flex items-center justify-between pt-3 border-t border-border/10">
          <div className="flex size-7 items-center justify-center rounded-full bg-color-iris text-white font-bold text-[9px] uppercase shadow-3xs select-none">
            {project.createdByInitials}
          </div>
          
          <Button
            variant="secondary"
            size="sm"
            className="h-8 px-4 text-xs font-bold text-color-iris bg-color-iris/5 hover:bg-color-iris/10 border border-color-iris/10 rounded-xl group/btn"
          >
            Open
            <ArrowRight className="size-3.5 ml-1 transition-transform group-hover/btn:translate-x-0.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
