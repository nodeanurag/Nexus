"use client";

import { Smile, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Role } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";
import type { ChatMessageInfo } from "@/server/actions/chat.actions";

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

export function ChatMessageList({
  messages,
  currentUserId,
  currentUserRole,
  onToggleReaction,
  onDeleteMessage,
}: {
  messages: ChatMessageInfo[];
  currentUserId: string;
  currentUserRole: Role;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onDeleteMessage: (messageId: string) => void;
}) {
  return (
    <div className="space-y-4">
      {messages.map((msg, index) => {
        const isSelf = msg.user.id === currentUserId;
        const prevMsg = messages[index - 1];

        // Date separator check
        const showDateHeader =
          !prevMsg ||
          new Date(prevMsg.createdAt).toDateString() !==
            new Date(msg.createdAt).toDateString();

        // Sender sequence consolidation check
        const isConsecutive =
          prevMsg &&
          prevMsg.user.id === msg.user.id &&
          !showDateHeader &&
          (new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime()) < 3 * 60 * 1000;

        const displayName = msg.user.name || msg.user.email || "User";
        const roleConf = ROLE_STYLES[msg.user.role];

        return (
          <div key={msg.id} className="space-y-3">
            {showDateHeader && (
              <div className="flex justify-center my-4 select-none">
                <span className="text-[10px] font-mono font-bold bg-muted/40 text-muted-foreground px-3 py-1 rounded-full border border-border/20">
                  {formatDateHeader(msg.createdAt)}
                </span>
              </div>
            )}

            <div
              className={cn(
                "flex gap-3 max-w-[85%] md:max-w-[70%]",
                isSelf ? "ml-auto flex-row-reverse" : "mr-auto",
                isConsecutive ? "mt-0.5" : "mt-3"
              )}
            >
              {/* Avatar bubble */}
              {!isConsecutive ? (
                <Avatar className="size-8.5 shrink-0 ring-2 ring-primary/5 shadow-3xs select-none">
                  <AvatarFallback
                    className={cn(
                      "text-[9px] font-bold text-white bg-gradient-to-br flex items-center justify-center uppercase",
                      getUserGradient(displayName)
                    )}
                  >
                    {displayName.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-8.5 shrink-0" />
              )}

              {/* Message body */}
              <div className="space-y-1">
                {!isConsecutive && (
                  <div
                    className={cn(
                      "flex items-center gap-1.5 text-[10px] font-bold select-none",
                      isSelf ? "justify-end text-primary" : "text-foreground/90"
                    )}
                  >
                    <span>{displayName}</span>
                    {roleConf && (
                      <Badge
                        variant="outline"
                        className={cn("px-1.5 py-0 text-[8px] uppercase tracking-wide rounded-md font-mono", roleConf.className)}
                      >
                        {roleConf.label}
                      </Badge>
                    )}
                  </div>
                )}

                <div className={cn("flex items-end gap-1.5 group/msg", isSelf ? "flex-row-reverse" : "")}>
                  <div className="flex flex-col max-w-full">
                    <div
                      className={cn(
                        "px-4 py-2.5 text-xs font-semibold leading-relaxed shadow-3xs break-words",
                        isSelf
                          ? "bg-gradient-to-br from-color-iris to-color-iris/80 text-white rounded-2xl rounded-tr-none"
                          : "bg-muted/80 text-foreground border border-border/40 rounded-2xl rounded-tl-none"
                      )}
                    >
                      {msg.content}
                    </div>

                    {/* Display Reactions */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className={cn("flex flex-wrap gap-1 mt-1", isSelf ? "justify-end" : "justify-start")}>
                        {msg.reactions.map((r) => {
                          const hasReacted = r.users.some((u) => u.id === currentUserId);
                          const usersList = r.users.map((u) => u.name).join(", ");
                          return (
                            <button
                              key={r.emoji}
                              type="button"
                              onClick={() => onToggleReaction(msg.id, r.emoji)}
                              title={usersList}
                              className={cn(
                                "flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border transition-colors select-none cursor-pointer",
                                hasReacted
                                  ? "bg-primary/15 border-primary/45 text-primary hover:bg-primary/25"
                                  : "bg-muted/50 border-border/40 text-muted-foreground hover:bg-muted"
                              )}
                            >
                              <span>{r.emoji}</span>
                              <span>{r.users.length}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className={cn("flex items-center gap-1.5 opacity-0 group-hover/msg:opacity-100 transition-opacity duration-150 select-none", isSelf ? "flex-row-reverse" : "")}>
                    <span className="text-[9px] text-muted-foreground font-mono">
                      {formatMessageTime(msg.createdAt)}
                    </span>

                    {/* Emoji Reactions Picker */}
                    <div className="relative group/picker">
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-primary transition-colors p-0.5 rounded cursor-pointer"
                        title="Add Reaction"
                      >
                        <Smile className="size-3.5" />
                      </button>
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden group-hover/picker:flex items-center gap-1.5 bg-neutral-900 border border-border/40 rounded-full shadow-lg p-1 z-50">
                        {["👍", "❤️", "🔥", "👀"].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => onToggleReaction(msg.id, emoji)}
                            className="hover:scale-125 transition-transform text-xs p-1 cursor-pointer select-none"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    {(isSelf || currentUserRole === Role.OWNER || currentUserRole === Role.ADMIN) && (
                      <button
                        type="button"
                        onClick={() => onDeleteMessage(msg.id)}
                        className="text-muted-foreground hover:text-rose-500 transition-colors p-0.5 rounded cursor-pointer"
                        title="Delete Message"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
