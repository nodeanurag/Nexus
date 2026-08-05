import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { logoutAction } from "@/server/actions/auth.actions";
import { cn } from "@/lib/utils";

export function SignOutButton({ 
  className, 
  buttonClassName,
  iconOnly = false
}: { 
  className?: string; 
  buttonClassName?: string;
  iconOnly?: boolean;
}) {
  return (
    <form action={logoutAction} className={className}>
      <Button type="submit" variant="outline" size="sm" className={cn("w-full justify-center gap-1.5", buttonClassName)}>
        <LogOut className="size-4" />
        {!iconOnly && <span>Sign out</span>}
      </Button>
    </form>
  );
}
