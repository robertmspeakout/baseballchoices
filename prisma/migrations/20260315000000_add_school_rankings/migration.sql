-- CreateTable
CREATE TABLE "SchoolRanking" (
    "id" TEXT NOT NULL,
    "schoolId" INTEGER NOT NULL,
    "ranking" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'D1Baseball',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolRanking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SchoolRanking_schoolId_key" ON "SchoolRanking"("schoolId");

-- CreateIndex
CREATE INDEX "SchoolRanking_schoolId_idx" ON "SchoolRanking"("schoolId");
