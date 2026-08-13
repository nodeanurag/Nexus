"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { fail, runAction, type ActionResult } from "./action-utils";

export interface TimeLogInfo {
  id: string;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  user: {
    id: string;
    name: string;
  };
}

/** Starts a time tracking log for a task. */
export async function startTaskTimerAction(taskId: string): Promise<ActionResult<TimeLogInfo>> {
  const user = await requireUser();

  return runAction(async () => {
    // Check if task exists and get workspace ID
    const task = await db.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });
    if (!task) {
      throw new Error("Task not found.");
    }

    // Check if there is already an active timer for this user on this task
    const active = await db.taskTimeLog.findFirst({
      where: {
        taskId,
        userId: user.id,
        endTime: null,
      },
    });
    if (active) {
      throw new Error("You already have an active timer running on this task.");
    }

    const log = await db.taskTimeLog.create({
      data: {
        taskId,
        userId: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    revalidatePath(`/workspaces/${task.project.workspaceId}/projects/${task.projectId}/tasks/${taskId}`);

    return {
      id: log.id,
      startTime: log.startTime.toISOString(),
      endTime: null,
      duration: null,
      user: {
        id: log.user.id,
        name: log.user.name,
      },
    };
  });
}

/** Stops the active time log for a task. */
export async function stopTaskTimerAction(taskId: string): Promise<ActionResult<TimeLogInfo>> {
  const user = await requireUser();

  return runAction(async () => {
    const task = await db.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });
    if (!task) {
      throw new Error("Task not found.");
    }

    const log = await db.taskTimeLog.findFirst({
      where: {
        taskId,
        userId: user.id,
        endTime: null,
      },
    });
    if (!log) {
      throw new Error("No active timer found on this task.");
    }

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - log.startTime.getTime()) / 1000);

    const updated = await db.taskTimeLog.update({
      where: { id: log.id },
      data: {
        endTime,
        duration: Math.max(0, duration),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Write to ActivityLog
    await db.activityLog.create({
      data: {
        workspaceId: task.project.workspaceId,
        actorId: user.id,
        action: "TASK_TIME_LOGGED",
        entityType: "Task",
        entityId: taskId,
        metadata: {
          title: task.title,
          duration: updated.duration,
        },
      },
    });

    revalidatePath(`/workspaces/${task.project.workspaceId}/projects/${task.projectId}/tasks/${taskId}`);
    revalidatePath(`/workspaces/${task.project.workspaceId}/activity`);

    return {
      id: updated.id,
      startTime: updated.startTime.toISOString(),
      endTime: updated.endTime ? updated.endTime.toISOString() : null,
      duration: updated.duration,
      user: {
        id: updated.user.id,
        name: updated.user.name,
      },
    };
  });
}

/** Lists all time tracking logs for a task. */
export async function listTaskTimeLogsAction(taskId: string): Promise<ActionResult<TimeLogInfo[]>> {
  const user = await requireUser();

  return runAction(async () => {
    const logs = await db.taskTimeLog.findMany({
      where: { taskId },
      orderBy: { startTime: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return logs.map((log) => ({
      id: log.id,
      startTime: log.startTime.toISOString(),
      endTime: log.endTime ? log.endTime.toISOString() : null,
      duration: log.duration,
      user: {
        id: log.user.id,
        name: log.user.name,
      },
    }));
  });
}
