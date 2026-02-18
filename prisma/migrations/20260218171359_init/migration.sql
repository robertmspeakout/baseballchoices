-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "trialExpiresAt" DATETIME NOT NULL,
    "membershipActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "gradYear" INTEGER,
    "primaryPosition" TEXT,
    "secondaryPosition" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "highSchool" TEXT,
    "travelBall" TEXT,
    "gpa" TEXT,
    "gpaType" TEXT,
    "satScore" TEXT,
    "actScore" TEXT,
    "profileComplete" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Preferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "divisionPreference" TEXT,
    "maxDistanceFromHome" INTEGER,
    "preferredRegions" TEXT,
    "maxTuition" INTEGER,
    "schoolSize" TEXT,
    "highAcademic" BOOLEAN NOT NULL DEFAULT false,
    "competitiveness" TEXT,
    "draftImportance" TEXT,
    "preferredConferences" TEXT,
    "preferredTiers" TEXT,
    CONSTRAINT "Preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserSchoolData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "schoolId" INTEGER NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT NOT NULL DEFAULT '',
    "lastContacted" TEXT,
    "recruitingStatus" TEXT,
    "theyveSeenMe" TEXT,
    "detail" TEXT,
    "myContactName" TEXT,
    "myContactEmail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserSchoolData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Preferences_userId_key" ON "Preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSchoolData_userId_schoolId_key" ON "UserSchoolData"("userId", "schoolId");
