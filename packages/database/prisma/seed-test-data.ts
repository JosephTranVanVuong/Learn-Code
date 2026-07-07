import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();
const COUNT = 20;
const pad = (n: number) => String(n).padStart(2, "0");

async function main() {
  // --- 20 Thể loại ---
  const categories = [];
  for (let i = 1; i <= COUNT; i++) {
    categories.push(
      await prisma.category.upsert({
        where: { slug: `test-the-loai-${pad(i)}` },
        update: {},
        create: { name: `Test Thể loại ${pad(i)}`, slug: `test-the-loai-${pad(i)}` },
      }),
    );
  }

  // --- 20 Tác giả ---
  const authors = [];
  for (let i = 1; i <= COUNT; i++) {
    authors.push(
      await prisma.author.upsert({
        where: { name: `Test Tác giả ${pad(i)}` },
        update: {},
        create: { name: `Test Tác giả ${pad(i)}` },
      }),
    );
  }

  // --- 20 Sách (mỗi cuốn 1 bản sao) ---
  const copies = [];
  for (let i = 1; i <= COUNT; i++) {
    const book = await prisma.book.upsert({
      where: { isbn: `TEST-ISBN-${pad(i)}` },
      update: {},
      create: {
        title: `Test Sách ${pad(i)}`,
        authorId: authors[i - 1].id,
        categoryId: categories[i - 1].id,
        isbn: `TEST-ISBN-${pad(i)}`,
        language: "Tiếng Việt",
      },
    });
    const copy = await prisma.bookCopy.upsert({
      where: { barcode: `TESTBC-${pad(i)}` },
      update: {},
      create: { bookId: book.id, barcode: `TESTBC-${pad(i)}`, location: "Kệ Test" },
    });
    copies.push(copy);
  }

  // --- 20 Độc giả ---
  const defaultPatronType = await prisma.patronType.findFirst({ where: { isDefault: true } });
  const patronPasswordHash = await argon2.hash("ChungSinh@123");
  const patrons = [];
  for (let i = 1; i <= COUNT; i++) {
    patrons.push(
      await prisma.patron.upsert({
        where: { studentCode: `TEST${pad(i)}` },
        update: { fullName: `Test Độc giả ${pad(i)}` },
        create: {
          studentCode: `TEST${pad(i)}`,
          fullName: `Test Độc giả ${pad(i)}`,
          className: "Lớp Test",
          passwordHash: patronPasswordHash,
          patronTypeId: defaultPatronType?.id,
        },
      }),
    );
  }

  // --- 20 Mượn/trả (đã trả trễ hạn) + 20 Phạt ---
  const fineSettings = await prisma.fineSettings.findUnique({ where: { id: "singleton" } });
  const finePerDayVnd = fineSettings?.finePerDayVnd ?? 5000;
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  let createdLoans = 0;
  let createdFines = 0;
  for (let i = 0; i < COUNT; i++) {
    const copy = copies[i];
    const patron = patrons[i];
    const daysLate = (i % 5) + 1;
    const borrowedAt = new Date(now - (daysLate + 14) * DAY);
    const dueDate = new Date(now - daysLate * DAY);
    const returnedAt = new Date(now - 1 * DAY);

    const existingLoan = await prisma.loan.findFirst({ where: { copyId: copy.id, patronId: patron.id } });
    if (existingLoan) continue;

    const loan = await prisma.loan.create({
      data: {
        copyId: copy.id,
        patronId: patron.id,
        borrowedAt,
        dueDate,
        returnedAt,
        status: "RETURNED",
      },
    });
    createdLoans += 1;

    await prisma.fine.create({
      data: {
        loanId: loan.id,
        patronId: patron.id,
        amount: daysLate * finePerDayVnd,
        reason: `Trả sách trễ hạn ${daysLate} ngày`,
        status: "UNPAID",
      },
    });
    createdFines += 1;
  }

  console.log("Tạo dữ liệu test hoàn tất:");
  console.log(`- ${COUNT} thể loại (test-the-loai-01..${pad(COUNT)})`);
  console.log(`- ${COUNT} tác giả (Test Tác giả 01..${pad(COUNT)})`);
  console.log(`- ${COUNT} sách + ${COUNT} bản sao (TESTBC-01..${pad(COUNT)})`);
  console.log(`- ${COUNT} độc giả (TEST01..${pad(COUNT)} / mật khẩu ChungSinh@123)`);
  console.log(`- ${createdLoans} lượt mượn (đã trả, trễ hạn) + ${createdFines} phiếu phạt (chưa thanh toán)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
