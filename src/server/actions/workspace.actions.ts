"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import { requireCapability } from "@/lib/permissions";
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
} from "@/lib/validations/workspace";
import * as workspaceService from "@/server/services/workspace.service";

import { fail, runAction, type ActionResult } from "./action-utils";

export async function createWorkspaceAction(input: {
  name: string;
}): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = createWorkspaceSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      "Please fix the errors below.",
      z.flattenError(parsed.error).fieldErrors,
    );
  }

  return runAction(async () => {
    const workspace = await workspaceService.createWorkspace(
      user.id,
      parsed.data.name,
    );
    revalidatePath("/dashboard");
    return { id: workspace.id };
  });
}

export async function updateWorkspaceAction(
  workspaceId: string,
  input: { name: string },
): Promise<ActionResult<undefined>> {
  const user = await requireUser();
  const parsed = updateWorkspaceSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      "Please fix the errors below.",
      z.flattenError(parsed.error).fieldErrors,
    );
  }

  return runAction(async () => {
    await requireCapability(user.id, workspaceId, "workspace:update");
    await workspaceService.updateWorkspace(
      workspaceId,
      user.id,
      parsed.data.name,
    );
    revalidatePath(`/workspaces/${workspaceId}`);
    return undefined;
  });
}

export async function deleteWorkspaceAction(
  workspaceId: string,
): Promise<ActionResult<undefined>> {
  const user = await requireUser();

  return runAction(async () => {
    await requireCapability(user.id, workspaceId, "workspace:delete");
    await workspaceService.deleteWorkspace(workspaceId);
    revalidatePath("/dashboard");
    return undefined;
  });
}

export async function leaveWorkspaceAction(
  workspaceId: string,
): Promise<ActionResult<undefined>> {
  const user = await requireUser();

  return runAction(async () => {
    await workspaceService.leaveWorkspace(workspaceId, user.id);
    revalidatePath("/dashboard");
    revalidatePath("/workspaces");
    return undefined;
  });
}

export async function transferWorkspaceOwnershipAction(
  workspaceId: string,
  targetMemberId: string,
): Promise<ActionResult<undefined>> {
  const user = await requireUser();

  return runAction(async () => {
    await workspaceService.transferWorkspaceOwnership(
      workspaceId,
      user.id,
      targetMemberId,
    );
    revalidatePath(`/workspaces/${workspaceId}`);
    revalidatePath("/workspaces");
    return undefined;
  });
}

