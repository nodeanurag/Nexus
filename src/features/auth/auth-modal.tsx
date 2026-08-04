"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";

/**
 * AuthModal Component
 * 
 * A client-side-only dialog component that manages authentication states (login/register)
 * using URL query parameters (e.g., `?auth=login` or `?auth=register`).
 * 
 * Features:
 * - Syncs dialog visibility and mode directly with the router's active query parameters.
 * - Prevents hydration mismatch by deferring rendering until client-side mount is complete.
 * - Intercepts local router navigation via event delegation for register/login links.
 */
const AUTH_QUERY_KEY = "auth";
const AUTH_MODE_LOGIN = "login";
const AUTH_MODE_REGISTER = "register";

export function AuthModal() {
  // Flag to check if component is hydrated/mounted on the client to avoid SSR mismatches
  const [mounted, setMounted] = useState(false);
  
  // Hook interfaces for routing and URL state query manipulation
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const authParam = searchParams.get(AUTH_QUERY_KEY);
  const isOpen = authParam === AUTH_MODE_LOGIN || authParam === AUTH_MODE_REGISTER;

  // Helper function to update the URL query parameter and sync modal visibility state
  const updateAuthParam = useCallback((value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null) {
      params.delete(AUTH_QUERY_KEY);
    } else {
      params.set(AUTH_QUERY_KEY, value);
    }
    const queryStr = params.toString();
    router.replace(`${pathname}${queryStr ? `?${queryStr}` : ""}`, { scroll: false });
  }, [searchParams, router, pathname]);

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      updateAuthParam(null);
    }
  }, [updateAuthParam]);

  const handleSwitchToRegister = useCallback(() => {
    updateAuthParam(AUTH_MODE_REGISTER);
  }, [updateAuthParam]);

  const handleSwitchToLogin = useCallback(() => {
    updateAuthParam(AUTH_MODE_LOGIN);
  }, [updateAuthParam]);

  const handleContainerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
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
  }, [handleSwitchToRegister, handleSwitchToLogin]);

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
          {authParam === AUTH_MODE_LOGIN ? (
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
