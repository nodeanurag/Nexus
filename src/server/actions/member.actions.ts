"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import { requireCapability, requireMembership } from "@/lib/permissions";
import {
  addMemberSchema,
  updateMemberRoleSchema,
} from "@/lib/validations/workspace";
import * as memberService from "@/server/services/member.service";

import { Role } from "@/generated/prisma/enums";
import { fail, runAction, type ActionResult } from "./action-utils";

export interface WorkspaceMemberInfo {
  id: string;
  userId: string;
  role: Role;
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
  };
}

export async function listMembersAction(
  workspaceId: string,
): Promise<ActionResult<WorkspaceMemberInfo[]>> {
  const user = await requireUser();

  return runAction(async () => {
    await requireMembership(user.id, workspaceId);
    const members = await memberService.listMembers(workspaceId);
    return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
      user: {
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        avatarUrl: m.user.avatarUrl,
      },
    }));
  });
}


export async function addMemberAction(
  workspaceId: string,
  input: { email: string; role: string },
): Promise<ActionResult<undefined>> {
  const user = await requireUser();
  const parsed = addMemberSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      "Please fix the errors below.",
      z.flattenError(parsed.error).fieldErrors,
    );
  }

  return runAction(async () => {
    await requireCapability(user.id, workspaceId, "member:manage");
    await memberService.addMemberByEmail(
      workspaceId,
      user.id,
      parsed.data.email,
      parsed.data.role,
    );
    revalidatePath(`/workspaces/${workspaceId}/members`);
    return undefined;
  });
}

export async function updateMemberRoleAction(
  workspaceId: string,
  memberId: string,
  input: { role: string },
): Promise<ActionResult<undefined>> {
  const user = await requireUser();
  const parsed = updateMemberRoleSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Invalid role.", z.flattenError(parsed.error).fieldErrors);
  }

  return runAction(async () => {
    await requireCapability(user.id, workspaceId, "member:manage");
    await memberService.updateMemberRole(
      workspaceId,
      user.id,
      memberId,
      parsed.data.role,
    );
    revalidatePath(`/workspaces/${workspaceId}/members`);
    return undefined;
  });
}

export async function removeMemberAction(
  workspaceId: string,
  memberId: string,
): Promise<ActionResult<undefined>> {
  const user = await requireUser();

  return runAction(async () => {
    await requireCapability(user.id, workspaceId, "member:manage");
    await memberService.removeMember(workspaceId, user.id, memberId);
    revalidatePath(`/workspaces/${workspaceId}/members`);
    return undefined;
  });
}
