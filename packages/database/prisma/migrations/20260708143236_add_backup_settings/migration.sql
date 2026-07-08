-- CreateTable
CREATE TABLE "BackupSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "autoBackupEnabled" BOOLEAN NOT NULL DEFAULT true,
    "retentionCount" INTEGER NOT NULL DEFAULT 7,
    "updatedAt" DATETIME NOT NULL
);
