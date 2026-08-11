"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { requireCapability } from "@/lib/permissions";
import { projectInputSchema } from "@/lib/validations/project";
import * as projectService from "@/server/services/project.service";

import { fail, runAction, type ActionResult } from "./action-utils";

type ProjectFormInput = {
  title: string;
  description?: string;
  status?: string;
  deadline?: string;
};

export async function createProjectAction(
  workspaceId: string,
  input: ProjectFormInput,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = projectInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      "Please fix the errors below.",
      z.flattenError(parsed.error).fieldErrors,
    );
  }

  return runAction(async () => {
    await requireCapability(user.id, workspaceId, "project:create");
    const project = await projectService.createProject(
      workspaceId,
      user.id,
      parsed.data,
    );
    revalidatePath(`/workspaces/${workspaceId}/projects`);
    return { id: project.id };
  });
}

export async function updateProjectAction(
  projectId: string,
  input: ProjectFormInput,
): Promise<ActionResult<undefined>> {
  const user = await requireUser();
  const parsed = projectInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      "Please fix the errors below.",
      z.flattenError(parsed.error).fieldErrors,
    );
  }

  return runAction(async () => {
    const project = await projectService.getProjectById(projectId);
    if (!project) throw new AppError("Project not found.");

    await requireCapability(user.id, project.workspaceId, "project:update");
    await projectService.updateProject(
      project.workspaceId,
      projectId,
      user.id,
      parsed.data,
    );
    revalidatePath(`/workspaces/${project.workspaceId}/projects`);
    revalidatePath(`/workspaces/${project.workspaceId}/projects/${projectId}`);
    return undefined;
  });
}

export async function deleteProjectAction(
  projectId: string,
): Promise<ActionResult<undefined>> {
  const user = await requireUser();

  return runAction(async () => {
    const project = await projectService.getProjectById(projectId);
    if (!project) throw new AppError("Project not found.");

    await requireCapability(user.id, project.workspaceId, "project:delete");
    await projectService.deleteProject(project.workspaceId, projectId, user.id);
    revalidatePath(`/workspaces/${project.workspaceId}/projects`);
    return undefined;
  });
}
