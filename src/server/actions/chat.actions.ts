"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import { requireMembership } from "@/lib/permissions";
import { fail, runAction, type ActionResult } from "./action-utils";
import * as chatService from "@/server/services/chat.service";
import * as memberService from "@/server/services/member.service";
import { Role } from "@/generated/prisma/enums";

import * as chatReactionsService from "@/server/services/chat-reactions.service";

export interface ChatReactionInfo {
  emoji: string;
  users: { id: string; name: string }[];
}

export interface ChatMessageInfo {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    role: Role;
  };
  reactions: ChatReactionInfo[];
}

function groupReactions(
  reactions: { emoji: string; user: { id: string; name: string } }[],
): ChatReactionInfo[] {
  const map = new Map<string, { id: string; name: string }[]>();
  for (const r of reactions) {
    const list = map.get(r.emoji) || [];
    list.push({ id: r.user.id, name: r.user.name });
    map.set(r.emoji, list);
  }
  return Array.from(map.entries()).map(([emoji, users]) => ({
    emoji,
    users,
  }));
}

const sendMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(1000, "Message is too long"),
});

/** Fetches recent messages for a workspace, including user profile details and their roles. */
export async function listMessagesAction(
  workspaceId: string,
): Promise<ActionResult<ChatMessageInfo[]>> {
  const user = await requireUser();

  return runAction(async () => {
    await requireMembership(user.id, workspaceId);

    const [messages, members] = await Promise.all([
      chatService.listMessages(workspaceId),
      memberService.listMembers(workspaceId),
    ]);

    const roleMap = new Map<string, Role>(members.map((m) => [m.userId, m.role]));

    return messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
      user: {
        id: msg.user.id,
        name: msg.user.name,
        email: msg.user.email,
        avatarUrl: msg.user.avatarUrl,
        role: roleMap.get(msg.userId) || Role.MEMBER,
      },
      reactions: groupReactions(msg.reactions),
    }));
  });
}

/** Sends a chat message in the workspace. */
export async function sendMessageAction(
  workspaceId: string,
  input: { content: string },
): Promise<ActionResult<ChatMessageInfo>> {
  const user = await requireUser();
  const parsed = sendMessageSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Message content is invalid.", z.flattenError(parsed.error).fieldErrors);
  }

  return runAction(async () => {
    await requireMembership(user.id, workspaceId);

    const msg = await chatService.createMessage(workspaceId, user.id, parsed.data.content.trim());
    const members = await memberService.listMembers(workspaceId);
    const member = members.find((m) => m.userId === user.id);

    revalidatePath(`/workspaces/${workspaceId}/chat`);

    return {
      id: msg.id,
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
      user: {
        id: msg.user.id,
        name: msg.user.name,
        email: msg.user.email,
        avatarUrl: msg.user.avatarUrl,
        role: member?.role || Role.MEMBER,
      },
      reactions: [],
    };
  });
}

/** Deletes a chat message if the user is the author or is an Owner/Admin. */
export async function deleteMessageAction(
  workspaceId: string,
  messageId: string,
): Promise<ActionResult> {
  const user = await requireUser();

  return runAction(async () => {
    await requireMembership(user.id, workspaceId);

    const msg = await chatService.getMessageById(messageId);
    if (!msg) {
      throw new Error("Message not found.");
    }

    const members = await memberService.listMembers(workspaceId);
    const member = members.find((m) => m.userId === user.id);
    const isOwnerOrAdmin = member?.role === Role.OWNER || member?.role === Role.ADMIN;
    const isAuthor = msg.userId === user.id;

    if (!isAuthor && !isOwnerOrAdmin) {
      throw new Error("You do not have permission to delete this message.");
    }

    await chatService.deleteMessage(messageId);
    revalidatePath(`/workspaces/${workspaceId}/chat`);
    return undefined;
  });
}

/** Clears all chat messages if the user is an Owner/Admin. */
export async function clearChatAction(workspaceId: string): Promise<ActionResult> {
  const user = await requireUser();

  return runAction(async () => {
    await requireMembership(user.id, workspaceId);

    const members = await memberService.listMembers(workspaceId);
    const member = members.find((m) => m.userId === user.id);
    const isOwnerOrAdmin = member?.role === Role.OWNER || member?.role === Role.ADMIN;

    if (!isOwnerOrAdmin) {
      throw new Error("You do not have permission to clear this chatroom.");
    }

    await chatService.clearMessages(workspaceId);
    revalidatePath(`/workspaces/${workspaceId}/chat`);
    return undefined;
  });
}

/** Toggles an emoji reaction on a message. */
export async function toggleReactionAction(
  workspaceId: string,
  messageId: string,
  emoji: string,
): Promise<ActionResult> {
  const user = await requireUser();

  return runAction(async () => {
    await requireMembership(user.id, workspaceId);

    const existing = await chatReactionsService.getReaction(messageId, user.id, emoji);
    if (existing) {
      await chatReactionsService.removeReaction(messageId, user.id, emoji);
    } else {
      await chatReactionsService.addReaction(messageId, user.id, emoji);
    }

    revalidatePath(`/workspaces/${workspaceId}/chat`);
    return undefined;
  });
}
