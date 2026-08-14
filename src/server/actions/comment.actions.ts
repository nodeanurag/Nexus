"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { requireCapability } from "@/lib/permissions";
import { commentInputSchema } from "@/lib/validations/comment";
import * as commentService from "@/server/services/comment.service";
import { getTaskById } from "@/server/services/task.service";

import { fail, runAction, type ActionResult } from "./action-utils";

export async function createCommentAction(
  taskId: string,
  input: { content: string },
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = commentInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      "Please fix the errors below.",
      z.flattenError(parsed.error).fieldErrors,
    );
  }

  return runAction(async () => {
    const task = await getTaskById(taskId);
    if (!task) throw new AppError("Task not found.");

    await requireCapability(user.id, task.project.workspaceId, "comment:create");
    const comment = await commentService.createComment(
      taskId,
      user.id,
      parsed.data.content,
    );
    revalidatePath(
      `/workspaces/${task.project.workspaceId}/projects/${task.project.id}/tasks/${taskId}`,
    );
    return { id: comment.id };
  });
}

export async function deleteCommentAction(
  commentId: string,
): Promise<ActionResult<undefined>> {
  const user = await requireUser();

  return runAction(async () => {
    const { workspaceId, projectId, taskId } =
      await commentService.deleteComment(commentId, user.id);
    revalidatePath(
      `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`,
    );
    return undefined;
  });
}
