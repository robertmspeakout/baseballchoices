const { PrismaClient } = require("@prisma/client");
const { scrypt, randomBytes } = require("crypto");

const OWNER_EMAIL = "robertjmunsoniii@gmail.com";
const TEST_EMAIL = "testing@extrabase.com";

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = randomBytes(16).toString("hex");
    scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

async function main() {
  const prisma = new PrismaClient();
  const trial = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

  // Create or update test account (always refresh the password hash)
  const testHash = await hashPassword("123456789!");
  await prisma.user.upsert({
    where: { email: TEST_EMAIL },
    update: { passwordHash: testHash },
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
