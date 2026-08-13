"use client";

import { SendHorizontal, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ChatInput({
  inputText,
  setInputText,
  isPending,
  showHelp,
  setShowHelp,
  inputRef,
  onKeyDown,
  onSend,
}: {
  inputText: string;
  setInputText: (text: string) => void;
  isPending: boolean;
  showHelp: boolean;
  setShowHelp: (show: boolean) => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: (e?: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSend} className="border-t border-border/10 p-4 bg-card/5">
      <div className="flex gap-2 items-end rounded-xl border border-border/80 bg-muted/15 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all p-2 bg-card/30">
        <textarea
          value={inputText}
          ref={inputRef}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type your message here..."
          className="flex-1 max-h-24 min-h-[38px] h-[38px] py-2 px-3 text-xs bg-transparent border-0 outline-hidden focus:ring-0 resize-none font-semibold text-foreground placeholder:text-muted-foreground"
          rows={1}
          maxLength={1000}
          disabled={isPending}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setShowHelp(!showHelp)}
          className={cn("size-9 rounded-lg text-muted-foreground hover:bg-muted shrink-0", showHelp && "text-primary bg-primary/10")}
          title="Keyboard Shortcuts Help"
        >
          <Keyboard className="size-4" />
        </Button>
        <Button
          type="submit"
          size="icon"
          className="size-9 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground shadow-2xs shrink-0 cursor-pointer"
          disabled={!inputText.trim() || isPending}
        >
          <SendHorizontal className="size-4" />
        </Button>
      </div>

      {showHelp && (
        <div className="absolute bottom-24 right-6 p-4 rounded-2xl bg-card border border-border/60 shadow-lg text-foreground max-w-xs space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200 z-50 bg-neutral-955/95 backdrop-blur-md bg-neutral-950">
          <h3 className="text-xs font-bold flex items-center gap-1.5 border-b border-border/20 pb-2">
            <Keyboard className="size-4 text-primary" /> Keyboard Shortcuts
          </h3>
          <ul className="text-[10px] space-y-2 font-semibold">
            <li className="flex justify-between items-center gap-4">
              <span className="text-muted-foreground">Focus Input</span>
              <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border/50 text-[9px] font-mono">Ctrl + I</kbd>
            </li>
            <li className="flex justify-between items-center gap-4">
              <span className="text-muted-foreground">Send Message</span>
              <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border/50 text-[9px] font-mono">Enter</kbd>
            </li>
            <li className="flex justify-between items-center gap-4">
              <span className="text-muted-foreground">New Line</span>
              <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border/50 text-[9px] font-mono">Shift + Enter</kbd>
            </li>
            <li className="flex justify-between items-center gap-4">
              <span className="text-muted-foreground">Clear / Unfocus</span>
              <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border/50 text-[9px] font-mono">Esc</kbd>
            </li>
            <li className="flex justify-between items-center gap-4">
              <span className="text-muted-foreground">Scroll to Bottom</span>
              <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border/50 text-[9px] font-mono">Ctrl + Shift + B</kbd>
            </li>
          </ul>
        </div>
      )}
    </form>
  );
}
