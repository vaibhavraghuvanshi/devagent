import type { NextAuthConfig } from "next-auth";

// Single source of truth for the secret — used by both the middleware
// NextAuth instance and the main auth.ts instance so JWT tokens are
// encrypted and decrypted with the same key.
const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

export const authConfig = {
  secret,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      if (pathname === "/login") return true;
      if (pathname.startsWith("/api/auth")) return true;
      if (!auth?.user) {
        return Response.redirect(new URL("/login", request.nextUrl.origin));
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
