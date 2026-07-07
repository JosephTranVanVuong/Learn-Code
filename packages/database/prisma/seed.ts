import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  const adminPasswordHash = await argon2.hash("Admin@123");
  const admin = await prisma.user.upsert({
    where: { email: "thuthu@cvpl.edu.vn" },
    update: { role: "QUAN_TRI" },
    create: {
      fullName: "Quản trị viên",
      email: "thuthu@cvpl.edu.vn",
      passwordHash: adminPasswordHash,
      role: "QUAN_TRI",
    },
  });

  const categoryData = [
    { name: "Thần học", slug: "than-hoc" },
    { name: "Triết học", slug: "triet-hoc" },
    { name: "Kinh Thánh", slug: "kinh-thanh" },
    { name: "Linh đạo & Tu đức", slug: "linh-dao-tu-duc" },
    { name: "Lịch sử Giáo hội", slug: "lich-su-giao-hoi" },
  ];
  const categories = [];
  for (const c of categoryData) {
    categories.push(
      await prisma.category.upsert({
        where: { slug: c.slug },
        update: {},
        create: c,
      }),
    );
  }

  const bookData = [
    {
      title: "Giáo lý Hội Thánh Công giáo",
      author: "Hội đồng Giám mục Việt Nam",
      categorySlug: "than-hoc",
      copies: 3,
    },
    {
      title: "Tổng luận Thần học",
      author: "Thomas Aquinas",
      categorySlug: "triet-hoc",
      copies: 2,
    },
    {
      title: "Kinh Thánh Trọn Bộ - Cựu Ước và Tân Ước",
      author: "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ",
      categorySlug: "kinh-thanh",
      copies: 4,
    },
    {
      title: "Gương Chúa Giêsu",
      author: "Thomas à Kempis",
      categorySlug: "linh-dao-tu-duc",
      copies: 2,
    },
    {
      title: "Lịch sử Giáo hội Công giáo Việt Nam",
      author: "Phan Phát Huồn",
      categorySlug: "lich-su-giao-hoi",
      copies: 2,
    },
  ];

  for (const b of bookData) {
    const category = categories.find((c) => c.slug === b.categorySlug)!;
    const author = await prisma.author.upsert({
      where: { name: b.author },
      update: {},
      create: { name: b.author },
    });
    const book = await prisma.book.upsert({
      where: { isbn: `SEED-${b.categorySlug}` },
      update: {},
      create: {
        title: b.title,
        authorId: author.id,
        categoryId: category.id,
        isbn: `SEED-${b.categorySlug}`,
        language: "Tiếng Việt",
      },
    });

    for (let i = 1; i <= b.copies; i++) {
      const barcode = `${book.id.slice(-6).toUpperCase()}-${i}`;
      await prisma.bookCopy.upsert({
        where: { barcode },
        update: {},
        create: {
          bookId: book.id,
          barcode,
          location: `Kệ ${b.categorySlug.slice(0, 2).toUpperCase()}`,
        },
      });
    }
  }

  const defaultPatronType = await prisma.patronType.upsert({
    where: { name: "Mặc định" },
    update: { isDefault: true },
    create: {
      name: "Mặc định",
      maxActiveLoans: 5,
      loanPeriodDays: 14,
      maxRenewals: 1,
      isDefault: true,
    },
  });

  await prisma.patron.updateMany({
    where: { patronTypeId: null },
    data: { patronTypeId: defaultPatronType.id },
  });

  const patronPasswordHash = await argon2.hash("ChungSinh@123");
  await prisma.patron.upsert({
    where: { studentCode: "CS001" },
    update: {},
    create: {
      studentCode: "CS001",
      fullName: "Nguyễn Văn An",
      className: "Khóa XII",
      passwordHash: patronPasswordHash,
      patronTypeId: defaultPatronType.id,
    },
  });
  await prisma.patron.upsert({
    where: { studentCode: "CS002" },
    update: {},
    create: {
      studentCode: "CS002",
      fullName: "Trần Văn Bình",
      className: "Khóa XIII",
      passwordHash: patronPasswordHash,
      patronTypeId: defaultPatronType.id,
    },
  });

  console.log("Seed hoàn tất.");
  console.log(`Tài khoản thủ thư: ${admin.email} / Admin@123`);
  console.log("Tài khoản độc giả: CS001 hoặc CS002 / ChungSinh@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
