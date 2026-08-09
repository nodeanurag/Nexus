import { redirect } from "next/navigation";

import { auth } from "@/auth";

export async function getSession() {
  return auth();
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Use in server components / actions that require authentication. Redirects to
 * /login when there is no session. Returns the authenticated user otherwise.
 */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
