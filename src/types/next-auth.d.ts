import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      accountType: string;
      membershipActive: boolean;
      trialExpiresAt: string;
      profileComplete: boolean;
      firstName: string;
      familyAccountId: string | null;
      linkedPlayerId: string | null;
    };
  }
}
