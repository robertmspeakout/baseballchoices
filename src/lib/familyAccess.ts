import { prisma } from "@/lib/prisma";

/**
 * Resolves the player's user ID for data access.
 * - If the user is a player, returns their own ID.
 * - If the user is a parent in a family account, returns the linked player's ID.
 * - Throws if a parent has no linked player yet.
 */
export async function resolvePlayerId(sessionUserId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
    select: {
      id: true,
      accountType: true,
      familyAccount: {
        include: {
          members: {
            select: { id: true, accountType: true },
          },
        },
      },
    },
  });

  if (!user) throw new Error("User not found");

  // Players always access their own data
  if (user.accountType === "player") return user.id;

  // Parents access the linked player's data
  if (user.familyAccount) {
    const player = user.familyAccount.members.find(
      (m) => m.accountType === "player"
    );
    if (player) return player.id;
  }

  throw new Error("No linked player");
}
