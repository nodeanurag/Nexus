"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";

export function AuthModal() {
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const authParam = searchParams.get("auth");
  const isOpen = authParam === "login" || authParam === "register";

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("auth");
      const queryStr = params.toString();
      router.replace(`${pathname}${queryStr ? `?${queryStr}` : ""}`, { scroll: false });
    }
  };

  const handleSwitchToRegister = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("auth", "register");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSwitchToLogin = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("auth", "login");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    
    // Check if clicked the "Create one free" link pointing to /register
    const registerLink = target.closest('a[href="/register"]');
    if (registerLink) {
      e.preventDefault();
      handleSwitchToRegister();
      return;
    }

    // Check if clicked the "Sign in" link pointing to /login
    const loginLink = target.closest('a[href="/login"]');
    if (loginLink) {
      e.preventDefault();
      handleSwitchToLogin();
      return;
    }
  };

  // Don't render anything until mounted to avoid SSR/client hydration mismatch.
  // useSearchParams() reads the URL which only exists on the client side.
  if (!mounted) return null;

  if (!isOpen) return null;


  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="max-w-[440px] p-8 rounded-2xl bg-card border border-border/80 shadow-2xl backdrop-blur-md"
        showCloseButton={true}
      >
        <div onClick={handleContainerClick} className="space-y-4 pt-4">
          {authParam === "login" ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <span className="inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-color-mist border-color-fog text-color-iris font-mono uppercase tracking-wider text-[11px]">
                  Welcome Back
                </span>
                <h2 className="font-heading text-3xl font-bold tracking-tight text-color-ink">
                  Sign in to Nexus
                </h2>
                <p className="text-color-slate text-sm max-w-xs">
                  Enter your credentials to access your workspace dashboard.
                </p>
              </div>
              <LoginForm />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <span className="inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-color-mist border-color-fog text-color-iris font-mono uppercase tracking-wider text-[11px]">
                  Get Started
                </span>
                <h2 className="font-heading text-3xl font-bold tracking-tight text-color-ink">
                  Create account
                </h2>
                <p className="text-color-slate text-sm max-w-xs">
                  Sign up to orchestrate high-velocity projects.
                </p>
              </div>
              <RegisterForm />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
