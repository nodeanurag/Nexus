"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Columns3,
  FolderKanban,
  LayoutDashboard,
  Settings,
  Users,
  ListTodo,
  MessageSquare,
} from "lucide-react";

import { cn } from "@/lib/utils";

export function WorkspaceNav({
  workspaceId,
  canManageWorkspace = false,
  collapsed = false,
}: {
  workspaceId: string;
  canManageWorkspace?: boolean;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const base = `/workspaces/${workspaceId}`;

  const items = [
    { href: base, label: "Overview", icon: LayoutDashboard, exact: true },
    { href: `${base}/projects`, label: "Projects", icon: FolderKanban },
    { href: `${base}/board`, label: "Board", icon: Columns3 },
    { href: `${base}/tasks`, label: "Tasks", icon: ListTodo },
    { href: `${base}/chat`, label: "Chat", icon: MessageSquare },
    { href: `${base}/members`, label: "Members", icon: Users },
    { href: `${base}/activity`, label: "Activity", icon: Activity },
    ...(canManageWorkspace
      ? [{ href: `${base}/settings`, label: "Settings", icon: Settings }]
      : []),
  ];


  return (
    <nav className={cn("flex gap-1.5 overflow-x-auto md:flex-col", collapsed ? "md:items-center" : "")}>
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            title={collapsed ? item.label : undefined}
            className={cn(
              "group flex items-center gap-3 py-2.5 px-3.5 text-sm font-semibold transition-all duration-200",
              active
                ? "bg-gradient-to-r from-primary/10 to-primary/0 text-primary md:border-l-2 md:border-primary md:pl-2.5 md:rounded-l-none md:rounded-r-xl rounded-xl shadow-2xs shadow-primary/5"
                : "text-muted-foreground md:border-l-2 md:border-transparent md:pl-2.5 md:rounded-l-none md:rounded-r-xl rounded-xl hover:bg-muted/50 hover:text-foreground hover:border-muted-foreground/20",
              collapsed ? "md:p-2.5 md:justify-center md:rounded-full md:border-l-0 md:pl-2.5" : ""
            )}
          >
            <Icon className={cn("size-4 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3", active && "text-primary")} />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
