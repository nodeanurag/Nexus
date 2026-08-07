import { cache } from "react";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { getMembership } from "@/lib/permissions";
import { getWorkspaceById } from "@/server/services/workspace.service";

/**
 * Loads the authenticated user, the workspace, and their role — or calls
 * notFound() if the workspace doesn't exist or the user isn't a member.
 * Wrapped in cache() so layout + page in the same request share one DB round.
 */
export const getWorkspaceContext = cache(async (workspaceId: string) => {
  const user = await requireUser();
  const workspace = await getWorkspaceById(workspaceId);
  if (!workspace) notFound();

  const membership = await getMembership(user.id, workspaceId);
  if (!membership) notFound();

  return { user, workspace, role: membership.role };
});
