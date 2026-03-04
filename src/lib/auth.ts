import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { authConfig } from "./auth.config";

const loginLimiter = rateLimit({
  name: "login",
  max: 10,
  windowMs: 15 * 60 * 1000, // 15 minutes
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Rate limit by email: max 10 login attempts per email per 15 minutes
        const email = (credentials.email as string).toLowerCase();
        const { allowed } = loginLimiter.check(email);
        if (!allowed) return null;

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
});
