"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, FolderKanban, Search, Users } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Workspace {
  id: string;
  name: string;
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

export function WorkspaceList({ workspaces }: { workspaces: Workspace[] }) {
  const [search, setSearch] = useState("");

  const filtered = workspaces.filter((ws) =>
    ws.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70" />
        <Input
          type="text"
          placeholder="Search workspaces..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-10 bg-card/65 backdrop-blur-md border-border/80 focus-visible:ring-primary/45 focus-visible:border-primary/50 transition-all rounded-xl"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/30 py-16 text-center shadow-xs">
          <p className="text-muted-foreground text-sm font-medium">
            {search ? "No workspaces found matching your query." : "No workspaces found."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-5 duration-500">
          {filtered.map((workspace) => {
            const gradient = getGradient(workspace.name);
            return (
              <Link
                key={workspace.id}
                href={`/workspaces/${workspace.id}`}
                className="group block h-full"
              >
                <Card className="h-full border-border/50 bg-card/75 shadow-xs backdrop-blur-sm transition-all duration-300 group-hover:-translate-y-1.5 group-hover:border-primary/40 group-hover:shadow-lg group-hover:shadow-primary/5">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} font-bold text-white shadow-sm group-hover:scale-105 transition-transform`}>
                        {workspace.name.slice(0, 2).toUpperCase()}
                      </div>
                      <CardTitle className="truncate text-lg font-semibold group-hover:text-primary transition-colors">
                        {workspace.name}
                      </CardTitle>
                    </div>
                    <ArrowRight className="size-4.5 text-muted-foreground opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-primary" />
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-color-mist px-2.5 py-1.5 text-color-ink border border-color-fog">
                        <FolderKanban className="size-3.5" />
                        {workspace._count.projects} {workspace._count.projects === 1 ? "project" : "projects"}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-[rgba(123,104,238,0.1)] px-2.5 py-1.5 text-color-iris border border-[rgba(123,104,238,0.2)]">
                        <Users className="size-3.5" />
                        {workspace._count.members} {workspace._count.members === 1 ? "member" : "members"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
