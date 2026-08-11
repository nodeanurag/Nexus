"use client";

import { useState } from "react";
import Link from "next/link";
import { Folder, CheckCircle, ClipboardList, Users, Search, LayoutGrid, List, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { ProjectCard, type ProjectCardData } from "./project-card";
import { ProjectFormDialog } from "./project-form-dialog";

type TabStatus = "ALL" | "ACTIVE" | "COMPLETED" | "ARCHIVED";

export function ProjectsListClient({
  projects,
  canManage,
  workspaceId,
  totalTasks,
  completedTasks,
  totalMembers,
}: {
  projects: ProjectCardData[];
  canManage: boolean;
  workspaceId: string;
  totalTasks: number;
  completedTasks: number;
  totalMembers: number;
}) {
  const [activeTab, setActiveTab] = useState<TabStatus>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [layout, setLayout] = useState<"grid" | "list">("grid");

  // Metrics calculation
  const totalProjects = projects.length;
  const activeProjectsCount = projects.filter((p) => p.status === "ACTIVE").length;
  const completedProjectsCount = projects.filter((p) => p.status === "COMPLETED").length;

  const activePercentage = totalProjects === 0 ? 0 : Math.round((activeProjectsCount / totalProjects) * 100);
  const completedProjectsPercentage = totalProjects === 0 ? 0 : Math.round((completedProjectsCount / totalProjects) * 100);
  const taskCompletionPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const stats = [
    {
      label: "Total Projects",
      value: totalProjects,
      icon: Folder,
      color: "text-blue-500 bg-blue-500/10",
      trend: `${completedProjectsPercentage}% completed`,
    },
    {
      label: "Active Projects",
      value: activeProjectsCount,
      icon: CheckCircle,
      color: "text-emerald-500 bg-emerald-500/10",
      trend: `${activePercentage}% active`,
    },
    {
      label: "Total Tasks",
      value: totalTasks,
      icon: ClipboardList,
      color: "text-indigo-500 bg-indigo-500/10",
      trend: `${taskCompletionPercentage}% done`,
    },
    {
      label: "Team Members",
      value: totalMembers,
      icon: Users,
      color: "text-purple-500 bg-purple-500/10",
      trend: "Active",
    },
  ];

  // Filtering logic
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    
    const matchesTab = activeTab === "ALL" || project.status === activeTab;
    
    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-6">
      {/* 1. Metrics stats row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border border-border/50 bg-card/45 backdrop-blur-xl rounded-2xl shadow-3xs hover:border-border/75 transition-all">
              <CardContent className="flex items-center gap-4.5 p-4 sm:p-5">
                <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl shadow-3xs", stat.color)}>
                  <Icon className="size-5.5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {stat.label}
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-black text-foreground leading-none">{stat.value}</span>
                    <span className="text-[9px] font-extrabold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full select-none">
                      {stat.trend}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 2. Filters bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pt-2">
        {/* Left tabs segment */}
        <div className="flex flex-wrap items-center bg-muted/65 dark:bg-muted/15 border border-border/40 p-1 rounded-xl w-fit">
          {(["ALL", "ACTIVE", "COMPLETED", "ARCHIVED"] as TabStatus[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer select-none",
                activeTab === tab
                  ? "bg-color-iris text-white shadow-3xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === "ALL" ? "All Projects" : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/75" />
            <Input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9.5 h-10 bg-card/50 border-border/60 rounded-xl focus-visible:ring-color-iris/30 font-semibold text-xs"
            />
          </div>

          <div className="flex items-center border border-border/50 bg-card/50 p-1 rounded-xl">
            <Button
              variant={layout === "grid" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => setLayout("grid")}
              className={cn("size-8 rounded-lg", layout === "grid" && "bg-color-iris/10 text-color-iris border border-color-iris/10")}
              title="Grid layout"
            >
              <LayoutGrid className="size-4" />
            </Button>
            <Button
              variant={layout === "list" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => setLayout("list")}
              className={cn("size-8 rounded-lg", layout === "list" && "bg-color-iris/10 text-color-iris border border-color-iris/10")}
              title="List layout"
            >
              <List className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 3. Grid / List of project cards */}
      {layout === "grid" ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 pt-2">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} canManage={canManage} />
          ))}

          {/* "+ Create new project" placeholder card at the end of the grid */}
          {canManage && activeTab !== "COMPLETED" && activeTab !== "ARCHIVED" && (
            <ProjectFormDialog
              workspaceId={workspaceId}
              trigger={({ onClick }) => (
                <div
                  onClick={onClick}
                  className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/20 hover:bg-card/40 transition-all p-8 text-center cursor-pointer min-h-[220px] group/new"
                >
                  <div className="flex size-11 items-center justify-center rounded-full bg-muted border border-border/65 text-muted-foreground group-hover/new:bg-color-iris/10 group-hover/new:text-color-iris group-hover/new:border-color-iris/15 transition-all shadow-3xs">
                    <Plus className="size-5.5" />
                  </div>
                  <h4 className="font-bold text-sm text-foreground mt-3 group-hover/new:text-color-iris transition-colors">Create new project</h4>
                  <p className="text-muted-foreground text-[11px] font-semibold mt-1 max-w-[200px] leading-relaxed">
                    Start a new project and bring your ideas to life.
                  </p>
                </div>
              )}
            />
          )}
        </div>
      ) : (
        /* List layout */
        <div className="space-y-3.5 pt-2">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border/55 rounded-2xl bg-card/15">
              <p className="text-muted-foreground text-sm font-semibold">No projects matching your search criteria.</p>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <Card key={project.id} className="border border-border/40 bg-card/45 backdrop-blur-xl rounded-xl hover:border-color-iris/30 shadow-3xs transition-all">
                <CardContent className="flex items-center justify-between p-4 gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-color-iris/10 text-color-iris shrink-0 font-bold font-mono text-xs">
                      {"</>"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link href={`/workspaces/${workspaceId}/projects/${project.id}`} className="font-bold text-sm text-foreground hover:text-color-iris transition-colors truncate">
                          {project.title}
                        </Link>
                        <span className={cn("size-1.5 rounded-full shrink-0",
                          project.status === "ACTIVE" ? "bg-emerald-500 animate-pulse" :
                          project.status === "COMPLETED" ? "bg-blue-500" : "bg-color-slate"
                        )} />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-semibold line-clamp-1">{project.description ?? "No description"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-right text-[10px] font-bold text-muted-foreground/80">
                      <span className="block text-foreground">{project.taskCount} tasks</span>
                      <span className="block mt-0.5">{project.progress}% completed</span>
                    </div>
                    <Link href={`/workspaces/${workspaceId}/projects/${project.id}`}>
                      <Button variant="secondary" size="sm" className="h-8 rounded-xl font-bold text-xs text-color-iris bg-color-iris/5 hover:bg-color-iris/10 border border-color-iris/10">
                        Open
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
