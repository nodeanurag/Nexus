"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";
import { Skeleton } from "@/components/ui/skeleton";

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

// Tailwind CSS layout & design system token constants
const STYLES = {
  overlay: "fixed inset-0 z-50 bg-black/10 backdrop-blur-xs flex items-center justify-center animate-fade-in",
  content: "max-w-[440px] p-8 rounded-2xl bg-card border border-border/80 shadow-2xl backdrop-blur-md",
  header: {
    badge: "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-color-mist border-color-fog text-color-iris font-mono uppercase tracking-wider text-[11px]",
    title: "font-heading text-3xl font-bold tracking-tight text-color-ink",
    subtitle: "text-color-slate text-sm max-w-xs text-center",
  }
};

export interface AuthModalProps {
  /** Optional callback triggered when the modal is closed */
  onClose?: () => void;
  /** Optional override for default view mode */
  defaultView?: "login" | "register";
}

export function AuthModal({ onClose, defaultView }: AuthModalProps = {}) {
  // Flag to check if component is hydrated/mounted on the client to avoid SSR mismatches
  const [mounted, setMounted] = useState(false);
  
  // Hook interfaces for routing and URL state query manipulation
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Logging helper for modal lifecycle tracing and analytics
  const logModalEvent = useCallback((event: string, details?: Record<string, any>) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[AuthModal] ${event}`, details || "");
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    logModalEvent("Mounted/Hydrated");
  }, [logModalEvent]);

  const authParam = searchParams.get(AUTH_QUERY_KEY);
  const isOpen = authParam === AUTH_MODE_LOGIN || authParam === AUTH_MODE_REGISTER;

  // Helper function to update the URL query parameter and sync modal visibility state
  const updateAuthParam = useCallback((value: string | null) => {
    logModalEvent("Query update triggered", { targetMode: value || "closed" });
    const params = new URLSearchParams(searchParams.toString());
    if (value === null) {
      params.delete(AUTH_QUERY_KEY);
    } else {
      params.set(AUTH_QUERY_KEY, value);
    }
    const queryStr = params.toString();
    router.replace(`${pathname}${queryStr ? `?${queryStr}` : ""}`, { scroll: false });
  }, [searchParams, router, pathname, logModalEvent]);

  const handleOpenChange = useCallback((open: boolean) => {
    logModalEvent("Visibility changed", { open });
    if (!open) {
      updateAuthParam(null);
      onClose?.();
    }
  }, [updateAuthParam, onClose, logModalEvent]);

  const handleSwitchToRegister = useCallback(() => {
    updateAuthParam(AUTH_MODE_REGISTER);
  }, [updateAuthParam]);

  const handleSwitchToLogin = useCallback(() => {
    updateAuthParam(AUTH_MODE_LOGIN);
  }, [updateAuthParam]);

  const handleContainerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    
    // Intercept clicks on links navigating to registration to avoid full page reload
    const registerLink = target.closest('a[href="/register"]');
    if (registerLink instanceof HTMLAnchorElement) {
      logModalEvent("Intercepted click navigating to register view");
      e.preventDefault();
      handleSwitchToRegister();
      return;
    }

    // Intercept clicks on links navigating to login to avoid full page reload
    const loginLink = target.closest('a[href="/login"]');
    if (loginLink instanceof HTMLAnchorElement) {
      logModalEvent("Intercepted click navigating to login view");
      e.preventDefault();
      handleSwitchToLogin();
      return;
    }
  }, [handleSwitchToRegister, handleSwitchToLogin, logModalEvent]);

  // Don't render anything until mounted to avoid SSR/client hydration mismatch.
  // If the page loads with the query parameter already set, show a styled skeleton fallback.
  if (!mounted) {
    const isServer = typeof window === "undefined";
    const hasAuthQuery = !isServer && (
      window.location.search.includes(`${AUTH_QUERY_KEY}=${AUTH_MODE_LOGIN}`) ||
      window.location.search.includes(`${AUTH_QUERY_KEY}=${AUTH_MODE_REGISTER}`)
    );

    if (hasAuthQuery) {
      return (
        <div className={STYLES.overlay}>
          <div className={`w-full ${STYLES.content} space-y-6 pt-12`}>
            <div className="flex flex-col items-center space-y-3">
              <Skeleton className="h-5 w-24 rounded-lg" />
              <Skeleton className="h-8 w-48 rounded-lg" />
              <Skeleton className="h-4 w-64 rounded-lg" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  if (!isOpen) return null;


  // Future Integrations:
  // - Support OAuth callback and custom redirect parameters (e.g. `?callbackUrl=...`).
  // - Extend props to support programmatic opening via custom boolean control.
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent 
        className={STYLES.content}
        showCloseButton={true}
      >
        <div onClick={handleContainerClick} className="space-y-4 pt-4">
          {authParam === AUTH_MODE_LOGIN ? (
            <div className="space-y-6">
              <AuthModalHeader
                badge="Welcome Back"
                title="Sign in to Nexus"
                subtitle="Enter your credentials to access your workspace dashboard."
              />
              <LoginForm />
            </div>
          ) : (
            <div className="space-y-6">
              <AuthModalHeader
                badge="Get Started"
                title="Create account"
                subtitle="Sign up to orchestrate high-velocity projects."
              />
              <RegisterForm />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface AuthModalHeaderProps {
  badge: string;
  title: string;
  subtitle: string;
}

function AuthModalHeader({ badge, title, subtitle }: AuthModalHeaderProps) {
  return (
    <div className="flex flex-col items-center text-center space-y-3">
      <span className={STYLES.header.badge}>
        {badge}
      </span>
      <DialogTitle className={STYLES.header.title}>
        {title}
      </DialogTitle>
      <DialogDescription className={STYLES.header.subtitle}>
        {subtitle}
      </DialogDescription>
    </div>
  );
}
