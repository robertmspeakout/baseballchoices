-- CreateTable
CREATE TABLE "FamilyAccount" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "inviteToken" TEXT,
    "inviteEmail" TEXT,
    "inviteExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FamilyAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FamilyAccount_inviteToken_key" ON "FamilyAccount"("inviteToken");

-- AlterTable: Add accountType and familyAccountId to User
ALTER TABLE "User" ADD COLUMN "accountType" TEXT NOT NULL DEFAULT 'player';
ALTER TABLE "User" ADD COLUMN "familyAccountId" TEXT;

-- AlterTable: Add addedByUserId to UserSchoolData
ALTER TABLE "UserSchoolData" ADD COLUMN "addedByUserId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_familyAccountId_fkey" FOREIGN KEY ("familyAccountId") REFERENCES "FamilyAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
