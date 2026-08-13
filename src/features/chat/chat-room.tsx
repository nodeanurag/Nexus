"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { SendHorizontal, Sparkles, MessageSquare, Keyboard, Trash2, Smile } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type ChatMessageInfo, sendMessageAction, listMessagesAction, deleteMessageAction, clearChatAction, toggleReactionAction } from "@/server/actions/chat.actions";
import { Role } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

const USER_GRADIENTS = [
  "from-color-iris to-color-aubergine",
  "from-color-charcoal to-color-ink",
  "from-color-slate to-color-ash",
  "from-color-aubergine to-color-ink",
  "from-color-iris to-color-ink",
];

function getUserGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % USER_GRADIENTS.length;
  return USER_GRADIENTS[index];
}

const ROLE_STYLES: Record<Role, { label: string; className: string }> = {
  OWNER: { label: "Owner", className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  ADMIN: { label: "Admin", className: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
  MEMBER: { label: "Member", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  VIEWER: { label: "Viewer", className: "bg-slate-500/10 text-slate-500 border-slate-500/20" },
};

function formatMessageTime(isoString: string) {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return "";
  }
}

function formatDateHeader(isoString: string) {
  try {
    const d = new Date(isoString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return "Today";
    } else if (d.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    }
  } catch {
    return "";
  }
}

import { ChatMessageList } from "./chat-message-list";
import { ChatInput } from "./chat-input";

export function WorkspaceChatRoom({
  workspaceId,
  initialMessages,
  currentUserId,
  currentUserProfile,
}: {
  workspaceId: string;
  initialMessages: ChatMessageInfo[];
  currentUserId: string;
  currentUserProfile: { name: string; email: string; avatarUrl: string | null; role: Role };
}) {
  const [messages, setMessages] = useState<ChatMessageInfo[]>(initialMessages);
  const [inputText, setInputText] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isInitialScroll = useRef(true);

  // Auto scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior,
      });
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Focus Input: Ctrl+I
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      // Scroll to Bottom: Ctrl+Shift+B
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        scrollToBottom("smooth");
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Scroll to bottom on initial load and when message count changes
  useEffect(() => {
    if (isInitialScroll.current) {
      scrollToBottom("instant");
      isInitialScroll.current = false;
    } else {
      scrollToBottom("smooth");
    }
  }, [messages.length]);

  // Sync / Polling updates every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      startTransition(async () => {
        const res = await listMessagesAction(workspaceId);
        if (res.ok) {
          // Merge safely avoiding duplication
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newMsgs = res.data.filter((m) => {
              if (existingIds.has(m.id)) return false;
              // If we have an optimistic message with the same content and sender,
              // don't append it; it will be replaced when the send action resolves.
              const isOptimisticPending = prev.some(
                (p) => p.id.startsWith("optimistic-") && p.user.id === m.user.id && p.content === m.content
              );
              return !isOptimisticPending;
            });
            if (newMsgs.length > 0) {
              return [...prev, ...newMsgs];
            }
            return prev;
          });
        }
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [workspaceId]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const content = inputText.trim();
    setInputText("");

    // 1. Optimistic UI update
    const tempId = `optimistic-${Date.now()}`;
    const optimisticMessage: ChatMessageInfo = {
      id: tempId,
      content,
      createdAt: new Date().toISOString(),
      user: {
        id: currentUserId,
        name: currentUserProfile.name,
        email: currentUserProfile.email,
        avatarUrl: currentUserProfile.avatarUrl,
        role: currentUserProfile.role,
      },
      reactions: [],
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    // 2. Call server action
    const res = await sendMessageAction(workspaceId, { content });
    if (res.ok) {
      // Replace optimistic message with saved DB message
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? res.data : m))
      );
    } else {
      // Remove optimistic message and notify
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      toast.error(res.error || "Failed to send message.");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    // Optimistic delete
    setMessages((prev) => prev.filter((m) => m.id !== messageId));

    const res = await deleteMessageAction(workspaceId, messageId);
    if (!res.ok) {
      toast.error(res.error || "Failed to delete message.");
      // Reload from server to restore
      const reloadRes = await listMessagesAction(workspaceId);
      if (reloadRes.ok) {
        setMessages(reloadRes.data);
      }
    } else {
      toast.success("Message deleted.");
    }
  };

  const handleClearChat = async () => {
    if (!confirm("Are you sure you want to clear all messages in this chatroom? This action cannot be undone.")) {
      return;
    }
    const res = await clearChatAction(workspaceId);
    if (res.ok) {
      setMessages([]);
      toast.success("Chatroom cleared successfully.");
    } else {
      toast.error(res.error || "Failed to clear chatroom.");
    }
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    // Optimistic UI updates
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;

        // Clone current reactions
        let updatedReactions = [...msg.reactions];
        const existingReaction = updatedReactions.find((r) => r.emoji === emoji);

        if (existingReaction) {
          const alreadyReacted = existingReaction.users.some((u) => u.id === currentUserId);
          if (alreadyReacted) {
            // Remove user from this reaction
            const filteredUsers = existingReaction.users.filter((u) => u.id !== currentUserId);
            if (filteredUsers.length === 0) {
              // Delete the reaction capsule entirely
              updatedReactions = updatedReactions.filter((r) => r.emoji !== emoji);
            } else {
              existingReaction.users = filteredUsers;
            }
          } else {
            // Add user to existing reaction
            existingReaction.users.push({ id: currentUserId, name: currentUserProfile.name });
          }
        } else {
          // Create new reaction capsule
          updatedReactions.push({
            emoji,
            users: [{ id: currentUserId, name: currentUserProfile.name }],
          });
        }

        return { ...msg, reactions: updatedReactions };
      })
    );

    // Call server action
    const res = await toggleReactionAction(workspaceId, messageId, emoji);
    if (!res.ok) {
      toast.error(res.error || "Failed to update reaction.");
      // Reload from server to restore on failure
      const reloadRes = await listMessagesAction(workspaceId);
      if (reloadRes.ok) {
        setMessages(reloadRes.data);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setInputText("");
      inputRef.current?.blur();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[480px] rounded-3xl border border-border/40 bg-card/45 backdrop-blur-xl shadow-xs overflow-hidden">
      {/* Chat header */}
      <div className="flex items-center justify-between border-b border-border/10 p-5 bg-card/10">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-color-iris/10 border border-color-iris/20 flex items-center justify-center text-color-iris">
            <MessageSquare className="size-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              Workspace Chatroom
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            </h2>
            <p className="text-[10px] text-muted-foreground font-semibold">
              Live broadcast space for all workspace team members
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {(currentUserProfile.role === Role.OWNER || currentUserProfile.role === Role.ADMIN) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearChat}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border-rose-500/20 cursor-pointer h-8 px-3 rounded-lg"
            >
              <Trash2 className="size-3.5 mr-1" />
              Clear Chat
            </Button>
          )}
          <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-color-mist border border-color-fog px-2.5 py-0.5 text-[9px] font-bold font-mono text-color-iris select-none">
            <Sparkles className="size-3" />
            <span>Real-time channel</span>
          </div>
        </div>
      </div>

      {/* Message Feed */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-5 space-y-4"
        style={{ scrollbarWidth: "thin" }}
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="size-12 rounded-2xl bg-muted/30 border border-border/20 flex items-center justify-center text-muted-foreground">
              <MessageSquare className="size-6" />
            </div>
            <p className="text-xs text-muted-foreground font-bold max-w-xs">
              No messages yet. Send the first message to start the conversation!
            </p>
          </div>
        ) : (
          <ChatMessageList
            messages={messages}
            currentUserId={currentUserId}
            currentUserRole={currentUserProfile.role}
            onToggleReaction={handleToggleReaction}
            onDeleteMessage={handleDeleteMessage}
          />
        )}
      </div>

      {/* Input container */}
      <ChatInput
        inputText={inputText}
        setInputText={setInputText}
        isPending={isPending}
        showHelp={showHelp}
        setShowHelp={setShowHelp}
        inputRef={inputRef}
        onKeyDown={handleKeyDown}
        onSend={handleSend}
      />
    </div>
  );
}
