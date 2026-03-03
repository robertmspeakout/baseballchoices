import type { NextAuthConfig } from "next-auth";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Edge-compatible auth config (no Node.js modules).
 * Used by middleware for session/role checks.
 * The full config with Credentials provider lives in auth.ts.
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" as const },
  pages: {
    signIn: "/auth/login",
  },
  providers: [], // Credentials provider added in auth.ts (requires Node runtime)
  callbacks: {
    async jwt({ token, user, trigger, session }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role as string;
        token.membershipActive = user.membershipActive as boolean;
        token.trialExpiresAt = user.trialExpiresAt as string;
        token.profileComplete = user.profileComplete as boolean;
        token.firstName = user.firstName as string;
      }
      if (trigger === "update" && session) {
        if (session.profileComplete !== undefined) token.profileComplete = session.profileComplete;
        if (session.membershipActive !== undefined) token.membershipActive = session.membershipActive;
        if (session.trialExpiresAt !== undefined) token.trialExpiresAt = session.trialExpiresAt;
        if (session.role !== undefined) token.role = session.role;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).membershipActive = token.membershipActive;
        (session.user as any).trialExpiresAt = token.trialExpiresAt;
        (session.user as any).profileComplete = token.profileComplete;
        (session.user as any).firstName = token.firstName;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
