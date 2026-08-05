"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, type AuthFormState } from "@/server/actions/auth.actions";

const initialState: AuthFormState = {};

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      {state.error ? (
        <p
          role="alert"
          className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm"
        >
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
        {state.fieldErrors?.email ? (
          <p className="text-destructive text-sm">{state.fieldErrors.email[0]}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        {state.fieldErrors?.password ? (
          <p className="text-destructive text-sm">
            {state.fieldErrors.password[0]}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        className="w-full h-11 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-none transition-colors"
        disabled={pending}
      >
        {pending ? "Signing in…" : "Sign in to workspace"}
      </Button>

      <p className="text-muted-foreground text-center text-sm pt-2">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-ring font-semibold hover:underline">
          Create one free
        </Link>
      </p>
    </form>
  );
}
