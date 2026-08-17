"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus, Search, Settings, CheckSquare, Check } from "lucide-react";

import { CreateWorkspaceDialog } from "@/features/workspace/create-workspace-dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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

interface Workspace {
  id: string;
  name: string;
  _count?: {
    projects: number;
    members: number;
  };
}

export function WorkspaceSwitcher({
  workspaceId,
  workspaceName,
  workspaces,
  collapsed,
}: {
  workspaceId: string;
  workspaceName: string;
  workspaces: Workspace[];
  collapsed: boolean;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [recents, setRecents] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Track recents
  useEffect(() => {
    const stored = localStorage.getItem("nexus_recent_workspaces");
    let list: string[] = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(list)) list = [];

    // Filter out workspaces that no longer exist
    list = list.filter((id) => workspaces.some((w) => w.id === id));
    
    // Defer state update to next microtask to prevent cascading renders
    const finalList = list;
    Promise.resolve().then(() => {
      setRecents(finalList);
    });

    // Update with current
    const updated = [workspaceId, ...list.filter((id) => id !== workspaceId)].slice(0, 4);
    localStorage.setItem("nexus_recent_workspaces", JSON.stringify(updated));
  }, [workspaceId, workspaces]);

  const filteredWorkspaces = workspaces.filter((ws) =>
    ws.name.toLowerCase().includes(search.toLowerCase())
  );

  const recentWorkspaces = workspaces
    .filter((ws) => recents.includes(ws.id) && ws.id !== workspaceId)
    .slice(0, 3);

  const activeGradient = getGradient(workspaceName);

  return (
    <div className="relative" ref={containerRef}>
      {/* Switcher Button Trigger */}
      {collapsed ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex size-7 items-center justify-center rounded-lg bg-gradient-to-br font-bold text-white shadow-2xs cursor-pointer hover:opacity-90 transition-opacity",
            activeGradient
          )}
          title={workspaceName}
        >
          {workspaceName.slice(0, 2).toUpperCase()}
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group flex w-full items-center justify-between gap-2.5 rounded-xl border border-border/40 bg-card/45 p-2 text-left shadow-2xs hover:bg-muted/50 transition-all cursor-pointer min-w-0"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br font-bold text-white shadow-xs text-[10px]",
                activeGradient
              )}
            >
              {workspaceName.slice(0, 2).toUpperCase()}
            </div>
            <span className="truncate text-sm font-bold tracking-tight text-foreground/90">
              {workspaceName}
            </span>
          </div>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground/60 group-hover:text-foreground transition-colors" />
        </button>
      )}

      {/* Floating Switcher Dropdown */}
      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-1.5 w-64 rounded-xl border border-border/60 bg-popover/95 backdrop-blur-md p-1.5 shadow-lg shadow-black/5 ring-1 ring-foreground/10 outline-none animate-in fade-in zoom-in-95 duration-100",
            collapsed ? "left-full top-0 ml-2" : "left-0 top-full"
          )}
        >
          {/* Search Input */}
          <div className="relative mb-2 px-1 py-1">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/75" />
            <Input
              type="text"
              placeholder="Search workspaces..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-muted/40 border-border/60 focus-visible:ring-primary/45 rounded-lg w-full"
              autoFocus
            />
          </div>

          {/* Workspaces List / Search Results */}
          <div className="max-h-56 overflow-y-auto space-y-2.5 py-1 px-1">
            {search ? (
              // Search Results
              <div className="space-y-1">
                <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider px-1.5 mb-1">
                  Search Results
                </div>
                {filteredWorkspaces.length === 0 ? (
                  <div className="text-xs text-muted-foreground px-1.5 py-2">
                    No workspaces found
                  </div>
                ) : (
                  filteredWorkspaces.map((ws) => (
                    <button
                      key={ws.id}
                      onClick={() => {
                        setIsOpen(false);
                        router.push(`/workspaces/${ws.id}`);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold hover:bg-muted/65 transition-colors cursor-pointer text-left",
                        ws.id === workspaceId ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded bg-gradient-to-br font-bold text-white text-[8px]",
                            getGradient(ws.name)
                          )}
                        >
                          {ws.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="truncate">{ws.name}</span>
                      </div>
                      {ws.id === workspaceId && <Check className="size-3 text-color-iris shrink-0" />}
                    </button>
                  ))
                )}
              </div>
            ) : (
              // Default View: Recents + All
              <>
                {/* Active Workspace */}
                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider px-1.5 mb-1">
                    Active Workspace
                  </div>
                  <button
                    disabled
                    className="flex w-full items-center justify-between gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-bold bg-muted/40 text-foreground text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded bg-gradient-to-br font-bold text-white text-[8px]",
                          activeGradient
                        )}
                      >
                        {workspaceName.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="truncate">{workspaceName}</span>
                    </div>
                    <Check className="size-3.5 text-color-iris shrink-0" />
                  </button>
                </div>

                {/* Recent Workspaces */}
                {recentWorkspaces.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider px-1.5 mb-1">
                      Recent
                    </div>
                    {recentWorkspaces.map((ws) => (
                      <button
                        key={ws.id}
                        onClick={() => {
                          setIsOpen(false);
                          router.push(`/workspaces/${ws.id}`);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/65 transition-colors cursor-pointer text-left"
                      >
                        <div
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded bg-gradient-to-br font-bold text-white text-[8px]",
                            getGradient(ws.name)
                          )}
                        >
                          {ws.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="truncate">{ws.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* All Workspaces */}
                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider px-1.5 mb-1">
                    All Workspaces
                  </div>
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      onClick={() => {
                        setIsOpen(false);
                        router.push(`/workspaces/${ws.id}`);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold hover:bg-muted/65 transition-colors cursor-pointer text-left",
                        ws.id === workspaceId ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded bg-gradient-to-br font-bold text-white text-[8px]",
                            getGradient(ws.name)
                          )}
                        >
                          {ws.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="truncate">{ws.name}</span>
                      </div>
                      {ws.id === workspaceId && <Check className="size-3 text-color-iris shrink-0" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-border/60 my-1.5" />

          {/* Bottom Actions */}
          <div className="space-y-0.5 px-1 py-0.5">
            <span onClick={() => setIsOpen(false)} className="block w-full">
              <CreateWorkspaceDialog
                trigger={
                  <div className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-bold text-foreground hover:bg-muted/65 transition-colors cursor-pointer">
                    <Plus className="size-3.5 text-muted-foreground" />
                    Create Workspace
                  </div>
                }
              />
            </span>
            <Link
              href="/workspaces"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-bold text-foreground hover:bg-muted/65 transition-colors cursor-pointer"
            >
              <Settings className="size-3.5 text-muted-foreground" />
              Manage Workspaces
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
