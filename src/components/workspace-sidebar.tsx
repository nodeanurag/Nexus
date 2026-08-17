"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FiSettings } from "react-icons/fi";

import { WorkspaceNav } from "@/components/workspace-nav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SignOutButton } from "@/features/auth/sign-out-button";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

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

export function WorkspaceSidebar({
  workspaceId,
  workspaceName,
  canManageWorkspace,
  user,
  workspaces = [],
}: {
  workspaceId: string;
  workspaceName: string;
  canManageWorkspace: boolean;
  user: { name?: string | null; email?: string | null };
  workspaces?: { id: string; name: string }[];
}) {
  const [collapsed, setCollapsed] = useState(false);
  const display = user.name ?? user.email ?? "User";

  useEffect(() => {
    document.cookie = `last_workspace_id=${workspaceId}; path=/; max-age=31536000; SameSite=Lax`;
  }, [workspaceId]);

  return (
    <aside className={cn(
      "hidden shrink-0 border-r border-border/60 bg-sidebar/35 backdrop-blur-xs p-4 md:flex md:flex-col md:justify-between transition-all duration-300 relative",
      collapsed ? "w-16 px-2.5" : "w-56"
    )}>
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-5 z-20 flex size-6.5 items-center justify-center rounded-full border border-border/70 bg-card text-muted-foreground shadow-2xs hover:text-foreground hover:bg-accent transition-all cursor-pointer"
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
      </button>

      <div className="space-y-4">
        {/* Workspace Switcher */}
        <div className="border-b border-border/40 pb-4">
          <WorkspaceSwitcher
            workspaceId={workspaceId}
            workspaceName={workspaceName}
            workspaces={workspaces}
            collapsed={collapsed}
          />
        </div>


        {/* Navigation items */}
        <WorkspaceNav
          workspaceId={workspaceId}
          canManageWorkspace={canManageWorkspace}
          collapsed={collapsed}
        />
      </div>

      {/* User profile & Sign out */}
      <div className={cn(
        "border-t border-border/40 pt-4 mt-auto space-y-3",
        collapsed ? "flex flex-col items-center gap-2 space-y-0 px-0" : ""
      )}>
        <div className={cn("flex items-center gap-2", collapsed ? "flex-col" : "justify-between w-full")}>
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all group min-w-0 flex-1",
              collapsed ? "p-1 justify-center rounded-full" : ""
            )}
            title="Account settings"
          >
            <Avatar className="size-7.5 ring-2 ring-primary/10 transition-all group-hover:ring-primary shrink-0">
              <AvatarFallback className={cn("text-[9px] font-bold text-white bg-gradient-to-br flex items-center justify-center", getUserGradient(display))}>
                {display.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <span className="truncate flex items-center gap-1 min-w-0">
                <span className="truncate">{display}</span>
                <FiSettings className="size-3.5 opacity-60 group-hover:opacity-100 group-hover:rotate-45 transition-all shrink-0" />
              </span>
            )}
          </Link>
          <ThemeToggle className={cn("size-8 rounded-xl border border-border/40 hover:bg-muted/50 shrink-0", collapsed ? "size-7.5 rounded-full" : "")} />
        </div>
        
        {collapsed ? (
          <SignOutButton 
            className="flex justify-center w-full"
            buttonClassName="size-8 p-0 rounded-full flex items-center justify-center hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 border border-border/60"
            iconOnly
          />
        ) : (
          <div className="px-3">
            <SignOutButton buttonClassName="w-full justify-start text-xs rounded-xl" />
          </div>
        )}
      </div>
    </aside>
  );
}
