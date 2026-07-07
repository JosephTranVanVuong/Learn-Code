-- CreateTable
CREATE TABLE "PatronType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "maxActiveLoans" INTEGER NOT NULL DEFAULT 5,
    "loanPeriodDays" INTEGER NOT NULL DEFAULT 14,
    "maxRenewals" INTEGER NOT NULL DEFAULT 1,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LibrarySettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "name" TEXT NOT NULL DEFAULT 'Thư viện Đại Chủng Viện Phaolô Lê Bảo Tịnh',
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "logoUrl" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FineSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "finePerDayVnd" INTEGER NOT NULL DEFAULT 5000,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BarcodeSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "prefix" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Patron" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentCode" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "className" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "avatarUrl" TEXT,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "patronTypeId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Patron_patronTypeId_fkey" FOREIGN KEY ("patronTypeId") REFERENCES "PatronType" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Patron" ("avatarUrl", "className", "createdAt", "email", "fullName", "id", "isActive", "passwordHash", "phone", "studentCode", "updatedAt") SELECT "avatarUrl", "className", "createdAt", "email", "fullName", "id", "isActive", "passwordHash", "phone", "studentCode", "updatedAt" FROM "Patron";
DROP TABLE "Patron";
ALTER TABLE "new_Patron" RENAME TO "Patron";
CREATE UNIQUE INDEX "Patron_studentCode_key" ON "Patron"("studentCode");
CREATE UNIQUE INDEX "Patron_email_key" ON "Patron"("email");
CREATE INDEX "Patron_patronTypeId_idx" ON "Patron"("patronTypeId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PatronType_name_key" ON "PatronType"("name");
