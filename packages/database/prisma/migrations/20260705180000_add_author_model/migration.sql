-- CreateTable
CREATE TABLE "Author" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Author_name_key" ON "Author"("name");

-- Backfill: one Author row per distinct existing Book.author string value
INSERT INTO "Author" ("id", "name", "createdAt")
SELECT lower(
         hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' ||
         hex(randomblob(2)) || '-' || hex(randomblob(6))
       ),
       "author",
       CURRENT_TIMESTAMP
FROM (SELECT DISTINCT "author" FROM "Book");

-- RedefineTables: SQLite requires a full table rebuild to replace the plain
-- "author" text column with an "authorId" foreign key to the new Author table.
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Book" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "publisher" TEXT,
    "publishedYear" INTEGER,
    "isbn" TEXT,
    "language" TEXT DEFAULT 'Tiếng Việt',
    "description" TEXT,
    "coverImageUrl" TEXT,
    "categoryId" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Book_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Book_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_Book" ("id", "title", "authorId", "publisher", "publishedYear", "isbn", "language", "description", "coverImageUrl", "categoryId", "isDeleted", "createdAt", "updatedAt")
SELECT b."id", b."title", a."id", b."publisher", b."publishedYear", b."isbn", b."language", b."description", b."coverImageUrl", b."categoryId", b."isDeleted", b."createdAt", b."updatedAt"
FROM "Book" b
JOIN "Author" a ON a."name" = b."author";

DROP TABLE "Book";
ALTER TABLE "new_Book" RENAME TO "Book";

CREATE UNIQUE INDEX "Book_isbn_key" ON "Book"("isbn");
CREATE INDEX "Book_categoryId_idx" ON "Book"("categoryId");
CREATE INDEX "Book_authorId_idx" ON "Book"("authorId");
CREATE INDEX "Book_title_idx" ON "Book"("title");

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
