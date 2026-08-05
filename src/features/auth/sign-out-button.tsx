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
    </form>
  );
}
