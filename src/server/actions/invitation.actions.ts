"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { requireCapability, requireMembership } from "@/lib/permissions";
import * as invitationService from "@/server/services/invitation.service";
import { fail, runAction, type ActionResult } from "./action-utils";
import { Role } from "@/generated/prisma/enums";

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.nativeEnum(Role),
  projectId: z.string().optional(),
});

export async function inviteMemberAction(
  workspaceId: string,
  input: { email: string; role: Role; projectId?: string }
): Promise<ActionResult<undefined>> {
  const user = await requireUser();
  const parsed = inviteSchema.safeParse(input);

  if (!parsed.success) {
    return fail(
      "Please fix the errors below.",
      z.flattenError(parsed.error).fieldErrors
    );
  }

  return runAction(async () => {
    // Requires ADMIN or OWNER capability to manage members
    await requireCapability(user.id, workspaceId, "member:manage");

    await invitationService.createWorkspaceInvitation(
      workspaceId,
      user.id,
      parsed.data.email,
      parsed.data.role,
      parsed.data.projectId
    );

    revalidatePath(`/workspaces/${workspaceId}/members`);
    revalidatePath(`/workspaces/${workspaceId}/settings`);
    return undefined;
  });
}

export async function acceptInvitationAction(
  token: string
): Promise<ActionResult<{ workspaceId: string; projectId: string | null }>> {
  const user = await requireUser();

  return runAction(async () => {
    const result = await invitationService.acceptWorkspaceInvitation(
      token,
      user.id
    );

    revalidatePath(`/workspaces/${result.workspaceId}`);
    revalidatePath("/dashboard");
    return result;
  });
}

export async function revokeInvitationAction(
  workspaceId: string,
  invitationId: string
): Promise<ActionResult<undefined>> {
  const user = await requireUser();

  return runAction(async () => {
    await requireCapability(user.id, workspaceId, "member:manage");
    await invitationService.revokeWorkspaceInvitation(
      workspaceId,
      invitationId,
      user.id
    );

    revalidatePath(`/workspaces/${workspaceId}/members`);
    return undefined;
  });
}

export interface WorkspaceInvitationInfo {
  id: string;
  email: string;
  role: Role;
  projectId: string | null;
  createdAt: string;
  expiresAt: string;
  invitedBy: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

export async function listInvitationsAction(
  workspaceId: string
): Promise<ActionResult<WorkspaceInvitationInfo[]>> {
  const user = await requireUser();

  return runAction(async () => {
    await requireMembership(user.id, workspaceId);
    const invitations = await invitationService.listWorkspaceInvitations(
      workspaceId
    );

    return invitations.map((inv) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      projectId: inv.projectId,
      createdAt: inv.createdAt.toISOString(),
      expiresAt: inv.expiresAt.toISOString(),
      invitedBy: {
        id: inv.invitedBy.id,
        name: inv.invitedBy.name,
        email: inv.invitedBy.email,
      },
    }));
  });
}
