"use client";

import { useTheme } from "@/components/theme-provider";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "obsidian" ? "paper" : "obsidian")}
      className={className}
      title={theme === "obsidian" ? "Switch to Paper Light mode" : "Switch to Obsidian Dark mode"}
    >
      {theme === "obsidian" ? (
        <Moon className="size-4 text-amber-400 fill-amber-400/20" />
      ) : (
        <Sun className="size-4 text-amber-500 fill-amber-500/20" />
      )}
    </Button>
  );
}
