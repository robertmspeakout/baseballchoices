const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const OWNER_EMAIL = "robertjmunsoniii@gmail.com";
const TEST_EMAIL = "testing@extrabase.com";

async function main() {
  const prisma = new PrismaClient();
  const trial = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

  // Create test account
  const testHash = await bcrypt.hash("123456789!", 12);
  await prisma.user.upsert({
    where: { email: TEST_EMAIL },
    update: {},
    create: {
      firstName: "John",
      lastName: "Doe",
      email: TEST_EMAIL,
      passwordHash: testHash,
      role: "USER",
      trialExpiresAt: trial,
      profile: { create: {} },
    },
  });
  console.log("Test account ready:", TEST_EMAIL);

  await prisma.$disconnect();
}

main().catch(console.error);
