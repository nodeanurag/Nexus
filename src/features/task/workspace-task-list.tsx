"use client";

import { useState } from "react";
import Link from "next/link";
import { FolderKanban, Search, Users, ShieldAlert, ArrowUp, ArrowDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  projectId: string;
  project: {
    id: string;
    title: string;
  };
  assignee: {
    id: string;
    name: string;
    avatarUrl: string | null;
  } | null;
}

const STATUS_LABELS: Record<string, string> = {
  BACKLOG: "Backlog",
  TODO: "Todo",
  IN_PROGRESS: "In Progress",
  REVIEW: "Review",
  DONE: "Done",
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

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

export function WorkspaceTaskList({
  tasks,
  workspaceId,
}: {
  tasks: Task[];
  workspaceId: string;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [projectFilter, setProjectFilter] = useState("ALL");

  // Get unique projects for filter dropdown
  const projectsMap = new Map<string, string>();
  tasks.forEach((t) => projectsMap.set(t.project.id, t.project.title));
  const uniqueProjects = Array.from(projectsMap.entries()).map(([id, title]) => ({ id, title }));

  const filtered = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "ALL" || task.priority === priorityFilter;
    const matchesProject = projectFilter === "ALL" || task.projectId === projectFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesProject;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tasks</h1>
          <p className="text-muted-foreground text-sm">
            {filtered.length} of {tasks.length} tasks
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70" />
          <Input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 bg-card border-border/80 rounded-xl focus-visible:ring-primary/45 w-full"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Project Filter */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="h-10 px-3 text-sm bg-card border border-border/80 rounded-xl outline-hidden focus:ring-1 focus:ring-primary/40 focus:border-primary/50 text-foreground/80 font-medium"
          >
            <option value="ALL">All Projects</option>
            {uniqueProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 text-sm bg-card border border-border/80 rounded-xl outline-hidden focus:ring-1 focus:ring-primary/40 focus:border-primary/50 text-foreground/80 font-medium"
          >
            <option value="ALL">All Statuses</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-10 px-3 text-sm bg-card border border-border/80 rounded-xl outline-hidden focus:ring-1 focus:ring-primary/40 focus:border-primary/50 text-foreground/80 font-medium"
          >
            <option value="ALL">All Priorities</option>
            {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card/65 backdrop-blur-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-foreground/90">
            <thead>
              <tr className="border-b border-border/40 bg-muted/40 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="p-4 font-semibold">Task</th>
                <th className="p-4 font-semibold">Project</th>
                <th className="p-4 font-semibold">Assignee</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Priority</th>
                <th className="p-4 font-semibold text-right">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-sans">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-muted-foreground font-semibold">
                    No tasks found matching your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((task) => {
                  const assigneeName = task.assignee?.name ?? "Unassigned";

                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-muted/30 transition-colors group/row"
                    >
                      {/* Title */}
                      <td className="p-4 font-semibold">
                        <Link
                          href={`/workspaces/${workspaceId}/projects/${task.project.id}/tasks/${task.id}`}
                          className="hover:underline hover:text-primary transition-colors block max-w-sm truncate"
                        >
                          {task.title}
                        </Link>
                      </td>

                      {/* Project */}
                      <td className="p-4">
                        <Link
                          href={`/workspaces/${workspaceId}/projects/${task.project.id}`}
                          className="inline-flex items-center gap-1.5 font-medium text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <FolderKanban className="size-3.5" />
                          <span>{task.project.title}</span>
                        </Link>
                      </td>

                      {/* Assignee */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Avatar className="size-6">
                            {task.assignee ? (
                              <AvatarFallback
                                className={cn(
                                  "text-[8px] font-bold text-white bg-gradient-to-br flex items-center justify-center",
                                  getUserGradient(assigneeName)
                                )}
                              >
                                {assigneeName.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            ) : (
                              <AvatarFallback className="text-[8px] font-bold text-muted-foreground bg-muted flex items-center justify-center border border-border/40">
                                U
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <span className="text-xs font-semibold text-foreground/80">
                            {assigneeName}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "rounded-lg px-2 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider border",
                            task.status === "DONE"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : task.status === "IN_PROGRESS"
                              ? "bg-color-mist text-color-iris border-color-fog"
                              : "bg-color-mist text-color-slate border-color-fog"
                          )}
                        >
                          {STATUS_LABELS[task.status]}
                        </Badge>
                      </td>

                      {/* Priority */}
                      <td className="p-4">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "rounded-lg px-2 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider border",
                            task.priority === "URGENT"
                              ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                              : task.priority === "HIGH"
                              ? "bg-[rgba(123,104,238,0.1)] text-color-iris border-[rgba(123,104,238,0.2)]"
                              : "bg-color-mist text-color-slate border-color-fog"
                          )}
                        >
                          {PRIORITY_LABELS[task.priority]}
                        </Badge>
                      </td>

                      {/* Due Date */}
                      <td className="p-4 text-right font-mono text-xs text-muted-foreground">
                        {task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
