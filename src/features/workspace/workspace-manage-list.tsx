"use client";

import Link from "next/link";
import { FolderKanban, Users, Settings2, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { Role } from "@/generated/prisma/enums";

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

export function WorkspaceManageList({
  workspaces,
  onManage,
  onLeave,
}: {
  workspaces: WorkspaceWithRole[];
  onManage: (ws: WorkspaceWithRole) => void;
  onLeave: (ws: WorkspaceWithRole) => void;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in duration-300">
      {workspaces.map((workspace) => {
        const gradient = getGradient(workspace.name);
        const isOwner = workspace.role === "OWNER";
        const isAdmin = workspace.role === "ADMIN";
        const canManage = isOwner || isAdmin;

        return (
          <Card
            key={workspace.id}
            className="h-full border border-border/50 bg-card/45 backdrop-blur-xl shadow-3xs hover:shadow-2xs transition-all duration-300 hover:-translate-y-0.5 hover:border-border/70 relative overflow-hidden flex flex-col justify-between rounded-2xl"
          >
            {/* Top brand stripe */}
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-color-iris to-color-aubergine" />

            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3 pt-6 px-5">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br font-black text-white shadow-3xs text-xs select-none",
                    gradient
                  )}
                >
                  {workspace.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <CardTitle className="truncate text-sm font-bold text-foreground">
                    {workspace.name}
                  </CardTitle>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "mt-0.5 text-[8px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full select-none shadow-none border",
                      isOwner
                        ? "bg-color-iris/10 text-color-iris border-color-iris/20"
                        : "bg-muted text-muted-foreground border-border/60"
                    )}
                  >
                    {ROLE_LABELS[workspace.role]}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 px-5 pb-5 flex-1 flex flex-col justify-between">
              {/* Stats */}
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted/65 dark:bg-muted/15 px-2.5 py-1 border border-border/30">
                  <FolderKanban className="size-3.5 text-color-iris" />
                  {workspace._count.projects} {workspace._count.projects === 1 ? "project" : "projects"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted/65 dark:bg-muted/15 px-2.5 py-1 border border-border/30">
                  <Users className="size-3.5 text-color-iris" />
                  {workspace._count.members} {workspace._count.members === 1 ? "member" : "members"}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-border/10">
                <Link href={`/workspaces/${workspace.id}`} className="flex-1">
                  <Button variant="outline" className="w-full text-xs font-bold h-9 rounded-xl border-border/70 text-foreground hover:bg-muted/30">
                    Open Workspace
                  </Button>
                </Link>
                {canManage ? (
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 border-border/70 rounded-xl hover:bg-muted/50 cursor-pointer shadow-3xs"
                    title="Workspace Settings"
                    onClick={() => onManage(workspace)}
                  >
                    <Settings2 className="size-4 text-muted-foreground/80 hover:text-foreground" />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 border-border/70 rounded-xl hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20 cursor-pointer shadow-3xs"
                    title="Leave Workspace"
                    onClick={() => onLeave(workspace)}
                  >
                    <LogOut className="size-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
