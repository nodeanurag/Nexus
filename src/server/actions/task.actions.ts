"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { requireCapability } from "@/lib/permissions";
import { taskInputSchema, taskStatusSchema } from "@/lib/validations/task";
import * as taskService from "@/server/services/task.service";

import { fail, runAction, type ActionResult } from "./action-utils";

type TaskFormInput = {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  assigneeId?: string;
};

function revalidateTask(workspaceId: string, projectId: string, taskId?: string) {
  revalidatePath(`/workspaces/${workspaceId}/projects/${projectId}`);
  if (taskId) {
    revalidatePath(
      `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`,
    );
  }
}

export async function createTaskAction(
  projectId: string,
  input: TaskFormInput,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = taskInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      "Please fix the errors below.",
      z.flattenError(parsed.error).fieldErrors,
    );
  }

  return runAction(async () => {
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { workspaceId: true },
    });
    if (!project) throw new AppError("Project not found.");

    await requireCapability(user.id, project.workspaceId, "task:create");
    const task = await taskService.createTask(projectId, user.id, parsed.data);
    revalidateTask(project.workspaceId, projectId, task.id);
    return { id: task.id };
  });
}

export async function updateTaskAction(
  taskId: string,
  input: TaskFormInput,
): Promise<ActionResult<undefined>> {
  const user = await requireUser();
  const parsed = taskInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      "Please fix the errors below.",
      z.flattenError(parsed.error).fieldErrors,
    );
  }

  return runAction(async () => {
    const task = await taskService.getTaskById(taskId);
    if (!task) throw new AppError("Task not found.");

    await requireCapability(user.id, task.project.workspaceId, "task:update");
    await taskService.updateTask(taskId, user.id, parsed.data);
    revalidateTask(task.project.workspaceId, task.project.id, taskId);
    return undefined;
  });
}

export async function updateTaskStatusAction(
  taskId: string,
  input: { status: string },
): Promise<ActionResult<undefined>> {
  const user = await requireUser();
  const parsed = taskStatusSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Invalid status.");
  }

  return runAction(async () => {
    const task = await taskService.getTaskById(taskId);
    if (!task) throw new AppError("Task not found.");

    await requireCapability(user.id, task.project.workspaceId, "task:update");
    await taskService.updateTaskStatus(taskId, user.id, parsed.data.status);
    revalidateTask(task.project.workspaceId, task.project.id, taskId);
    return undefined;
  });
}

export async function deleteTaskAction(
  taskId: string,
): Promise<ActionResult<undefined>> {
  const user = await requireUser();

  return runAction(async () => {
    const task = await taskService.getTaskById(taskId);
    if (!task) throw new AppError("Task not found.");

    await requireCapability(user.id, task.project.workspaceId, "task:delete");
    await taskService.deleteTask(taskId, user.id);
    revalidateTask(task.project.workspaceId, task.project.id);
    return undefined;
  });
}
