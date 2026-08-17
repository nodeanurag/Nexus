import type { Metadata } from "next";
import { AppHeader } from "@/components/app-header";
import { requireUser } from "@/lib/auth/session";
import { listWorkspacesWithRolesForUser } from "@/server/services/workspace.service";
import { WorkspacesManager } from "@/features/workspace/workspaces-manager";

export const metadata: Metadata = {
  title: "Manage Workspaces — Nexus",
};

export default async function ManageWorkspacesPage() {
  const user = await requireUser();
  const memberships = await listWorkspacesWithRolesForUser(user.id);

  const workspacesWithRoles = memberships.map((m) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    ownerId: m.workspace.ownerId,
    role: m.role,
    _count: m.workspace._count,
  }));

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <AppHeader user={user} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <WorkspacesManager initialWorkspaces={workspacesWithRoles} user={user} />
      </main>
    </div>
  );
}
