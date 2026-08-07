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