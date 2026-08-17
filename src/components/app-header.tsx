import Link from "next/link";
import { NexusLogo } from "@/components/nexus-logo";
import { FiSettings } from "react-icons/fi";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/features/auth/sign-out-button";

function initials(value: string) {
  const parts = value.trim().split(/\s+/);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : value.slice(0, 2);
  return letters.toUpperCase();
}

export function AppHeader({
  user,
  hideUser = false,
}: {
  user: { name?: string | null; email?: string | null };
  hideUser?: boolean;
}) {
  const display = user.name ?? user.email ?? "User";

  return (
    <header className="bg-background/80 sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/60 backdrop-blur-md px-4 shadow-2xs sm:px-6 transition-all">
      <Link href="/dashboard" className="hover:opacity-90 transition-opacity">
        <NexusLogo imageClassName="h-10 w-auto object-contain" />
      </Link>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        {!hideUser && (
          <>
            <Link
              href="/settings"
              className="hover:bg-primary/10 hover:text-primary hidden items-center gap-2.5 rounded-full border border-transparent px-3 py-1.5 transition-all duration-200 sm:flex group"
              title="Account settings"
            >
              <Avatar className="size-7 ring-2 ring-primary/20 transition-all group-hover:ring-primary">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                  {initials(display)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium flex items-center gap-1.5">
                {display}
                <FiSettings className="size-3.5 opacity-60 group-hover:opacity-100 group-hover:rotate-45 transition-all" />
              </span>
            </Link>
            <SignOutButton />
          </>
        )}
      </div>
    </header>
  );
}
