import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, FolderKanban, Sparkles, Users, Activity, Zap } from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { CreateWorkspaceDialog } from "@/features/workspace/create-workspace-dialog";
import { WorkspaceList } from "@/features/workspace/workspace-list";
import { requireUser } from "@/lib/auth/session";
import { listWorkspacesForUser } from "@/server/services/workspace.service";

export const metadata: Metadata = {
  title: "Workspaces — Nexus",
};

export default async function DashboardPage() {
  const user = await requireUser();
  const workspaces = await listWorkspacesForUser(user.id);

  if (workspaces.length > 0) {
    const cookieStore = await cookies();
    const lastWorkspaceId = cookieStore.get("last_workspace_id")?.value;
    const isValid = workspaces.some((w) => w.id === lastWorkspaceId);

    if (lastWorkspaceId && isValid) {
      redirect(`/workspaces/${lastWorkspaceId}`);
    } else {
      redirect(`/workspaces/${workspaces[0].id}`);
    }
  }

  const firstName = user.name?.split(" ")[0] ?? "there";

  return (
    <div className="relative min-h-svh flex-col bg-background flex">
      {/* Ambient background glowing accents */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none select-none">
        <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] rounded-full bg-color-iris/5 blur-[120px] dark:bg-color-iris/5 animate-pulse duration-10000" />
        <div className="absolute top-[35%] right-[5%] w-[400px] h-[400px] rounded-full bg-color-aubergine/5 blur-[100px] dark:bg-color-aubergine/4" />
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808006_1px,transparent_1px),linear-gradient(to_bottom,#80808006_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)] opacity-70" />
      </div>

      <AppHeader user={user} />
      
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 flex flex-col justify-center">
        {/* Welcome Banner */}
        <div className="mb-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-center rounded-3xl border border-border/40 bg-card/45 backdrop-blur-xl p-8 sm:p-10 shadow-xs transition-all hover:border-border/60 group animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-color-mist/60 border border-border/30 px-3 py-1.5 text-xs font-semibold text-color-iris dark:bg-color-mist/20">
              <Sparkles className="size-3.5 text-color-iris animate-pulse" />
              <span>Workspace Portal</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-foreground">
              Welcome back, <span className="bg-gradient-to-r from-color-iris to-color-aubergine bg-clip-text text-transparent">{firstName}</span>!
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl leading-relaxed">
              Select an existing workspace below or launch a brand new initiative. Collaborate with your team, manage timelines, and hit your milestones.
            </p>
          </div>
          <div className="shrink-0 transition-transform duration-300">
            <CreateWorkspaceDialog />
          </div>
        </div>

        {workspaces.length === 0 ? (
          <div className="grid gap-8 lg:grid-cols-12 items-stretch animate-in fade-in duration-500">
            
            {/* Left: Main Call to Action Card */}
            <div className="lg:col-span-7 flex flex-col justify-between rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl p-8 sm:p-10 shadow-xs relative overflow-hidden transition-all hover:border-color-iris/30 group">
              {/* Internal glow accent */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-color-iris/5 blur-3xl rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2" />
              
              <div className="space-y-6">
                <div className="inline-flex rounded-2xl bg-color-iris/10 border border-color-iris/20 p-4 text-color-iris transition-transform duration-300 group-hover:rotate-3">
                  <Building2 className="size-8" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold tracking-tight text-foreground">No workspaces created yet</h3>
                  <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-lg">
                    A workspace is your team&apos;s command center. Create one now to centralize all tasks, projects, Kanban boards, and activity logs.
                  </p>
                </div>
              </div>

              {/* Action and details */}
              <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-6 border-t border-border/40">
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <Zap className="size-3.5 text-amber-500 animate-pulse" />
                  <span>Setup takes less than 10 seconds</span>
                </div>
                <div className="group-hover:scale-[1.01] transition-transform duration-300">
                  <CreateWorkspaceDialog 
                    trigger={
                      <div className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold px-6 py-3 hover:bg-primary/95 cursor-pointer select-none">
                        Create Your Workspace
                        <ArrowRight className="size-4" />
                      </div>
                    }
                  />
                </div>
              </div>
            </div>

            {/* Right: Onboarding Feature Previews */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-4">
              
              {/* Feature 1: Agile Kanban */}
              <div className="flex gap-4 items-start rounded-2xl border border-border/30 bg-card/45 backdrop-blur-md p-6 transition-all hover:border-color-iris/25 hover:bg-card/50">
                <div className="rounded-xl bg-color-iris/10 p-3 text-color-iris shrink-0">
                  <FolderKanban className="size-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-base text-foreground">Visual Kanban Boards</h4>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Organize your workflow columns, drag and drop tasks, set priorities, and see what needs immediate attention.
                  </p>
                </div>
              </div>

              {/* Feature 2: Collaboration */}
              <div className="flex gap-4 items-start rounded-2xl border border-border/30 bg-card/45 backdrop-blur-md p-6 transition-all hover:border-color-iris/25 hover:bg-card/50">
                <div className="rounded-xl bg-teal-500/10 p-3 text-teal-600 dark:text-teal-400 shrink-0">
                  <Users className="size-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-base text-foreground">Team Collaboration</h4>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Invite stakeholders, assign specific user roles (Owner, Admin, Member, Viewer), and collaborate on checklists together.
                  </p>
                </div>
              </div>

              {/* Feature 3: Actionable Analytics */}
              <div className="flex gap-4 items-start rounded-2xl border border-border/30 bg-card/45 backdrop-blur-md p-6 transition-all hover:border-color-iris/25 hover:bg-card/50">
                <div className="rounded-xl bg-color-aubergine/10 p-3 text-color-aubergine dark:text-color-iris shrink-0">
                  <Activity className="size-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-base text-foreground">Activity Logs & Comments</h4>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Trace changes history, post comments inside tasks, and stay on top of the single source of truth.
                  </p>
                </div>
              </div>

            </div>

          </div>
        ) : (
          <WorkspaceList workspaces={workspaces} />
        )}
      </main>
    </div>
  );
}
