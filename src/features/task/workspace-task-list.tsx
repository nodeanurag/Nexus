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
