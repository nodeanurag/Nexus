import type { NextAuthConfig } from "next-auth";

// Routes that require an authenticated session.
const PROTECTED_PREFIXES = ["/dashboard", "/workspaces", "/settings"];
const AUTH_ROUTES = ["/login", "/register"];

/**
 * Edge-safe Auth.js config (no Prisma / bcrypt). Shared by the middleware and
 * the full Node config in `auth.ts`. The Credentials provider is added in
 * `auth.ts` because it needs the database and password hashing.
 */
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      const isProtected = PROTECTED_PREFIXES.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
      );
      const isAuthRoute = AUTH_ROUTES.includes(pathname);

      if (isProtected) {
        // Returning false lets Auth.js redirect to the configured signIn page.
        return isLoggedIn;
      }

      if (isAuthRoute && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
