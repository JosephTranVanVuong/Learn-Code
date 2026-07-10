-- AlterTable
ALTER TABLE "Book" ADD COLUMN "authorMark" TEXT;
ALTER TABLE "Book" ADD COLUMN "classificationNumber" TEXT;

-- AlterTable
ALTER TABLE "BookCopy" ADD COLUMN "spineLabelPrintedAt" DATETIME;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN "ddcPrefix" TEXT;
