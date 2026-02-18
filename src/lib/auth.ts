import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: (credentials.email as string).toLowerCase() },
          include: { profile: true },
        });

        if (!user) return null;

        const passwordMatch = await verifyPassword(
          credentials.password as string,
          user.passwordHash
        );
        if (!passwordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          membershipActive: user.membershipActive,
          trialExpiresAt: user.trialExpiresAt.toISOString(),
          profileComplete: user.profile?.profileComplete ?? false,
          firstName: user.firstName,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        /* eslint-disable @typescript-eslint/no-explicit-any */
        token.role = (user as any).role as string;
        token.membershipActive = (user as any).membershipActive as boolean;
        token.trialExpiresAt = (user as any).trialExpiresAt as string;
        token.profileComplete = (user as any).profileComplete as boolean;
        token.firstName = (user as any).firstName as string;
      }
      // Allow session updates (e.g., after profile completion or membership change)
      if (trigger === "update" && session) {
        if (session.profileComplete !== undefined) token.profileComplete = session.profileComplete;
        if (session.membershipActive !== undefined) token.membershipActive = session.membershipActive;
        if (session.trialExpiresAt !== undefined) token.trialExpiresAt = session.trialExpiresAt;
        if (session.role !== undefined) token.role = session.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        /* eslint-disable @typescript-eslint/no-explicit-any */
        (session.user as any).role = token.role;
        (session.user as any).membershipActive = token.membershipActive;
        (session.user as any).trialExpiresAt = token.trialExpiresAt;
        (session.user as any).profileComplete = token.profileComplete;
        (session.user as any).firstName = token.firstName;
      }
      return session;
    },
  },
});
