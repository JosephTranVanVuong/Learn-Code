import { prisma } from "@thuvien/database";
import type { NotificationSettings } from "@thuvien/shared";
import { isMailerConfigured, sendMail } from "../../lib/mailer";
import { getFineSettings } from "../settings/service";

const SETTINGS_ID = "singleton";

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const row = await prisma.notificationSettings.upsert({
    where: { id: SETTINGS_ID },
    update: {},
    create: { id: SETTINGS_ID },
  });
  return { autoSendEnabled: row.autoSendEnabled };
}

export async function updateNotificationSettings(autoSendEnabled: boolean): Promise<NotificationSettings> {
  const row = await prisma.notificationSettings.upsert({
    where: { id: SETTINGS_ID },
    update: { autoSendEnabled },
    create: { id: SETTINGS_ID, autoSendEnabled },
  });
  return { autoSendEnabled: row.autoSendEnabled };
}

interface NotifiableLoan {
  loanId: string;
  bookTitle: string;
  barcode: string;
  dueDate: Date;
  patronName: string;
  studentCode: string;
  patronEmail: string | null;
}

interface NotifySendResult {
  smtpConfigured: boolean;
  totalLoans: number;
  sent: number;
  skippedNoEmail: number;
  failed: number;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

async function getDueSoonLoans(): Promise<NotifiableLoan[]> {
  const tomorrowStart = new Date(startOfDay(new Date()).getTime() + 24 * 60 * 60 * 1000);
  const tomorrowEnd = new Date(tomorrowStart.getTime() + 24 * 60 * 60 * 1000);

  const rows = await prisma.loan.findMany({
    where: { status: "ACTIVE", dueDate: { gte: tomorrowStart, lt: tomorrowEnd } },
    include: { copy: { include: { book: true } }, patron: true },
    orderBy: { dueDate: "asc" },
  });

  return rows.map((r) => ({
    loanId: r.id,
    bookTitle: r.copy.book.title,
    barcode: r.copy.barcode,
    dueDate: r.dueDate,
    patronName: r.patron.fullName,
    studentCode: r.patron.studentCode,
    patronEmail: r.patron.email,
  }));
}

async function getOverdueLoans(): Promise<NotifiableLoan[]> {
  const rows = await prisma.loan.findMany({
    where: { status: "ACTIVE", dueDate: { lt: new Date() } },
    include: { copy: { include: { book: true } }, patron: true },
    orderBy: { dueDate: "asc" },
  });

  return rows.map((r) => ({
    loanId: r.id,
    bookTitle: r.copy.book.title,
    barcode: r.copy.barcode,
    dueDate: r.dueDate,
    patronName: r.patron.fullName,
    studentCode: r.patron.studentCode,
    patronEmail: r.patron.email,
  }));
}

function daysLate(dueDate: Date, now: Date): number {
  return Math.max(1, Math.ceil((now.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000)));
}

export async function listDueSoonLoans() {
  const loans = await getDueSoonLoans();
  return loans.map((l) => ({
    loanId: l.loanId,
    bookTitle: l.bookTitle,
    barcode: l.barcode,
    dueDate: l.dueDate.toISOString(),
    patronName: l.patronName,
    studentCode: l.studentCode,
    hasEmail: Boolean(l.patronEmail),
  }));
}

export async function listOverdueForNotify() {
  const now = new Date();
  const [loans, { finePerDayVnd }] = await Promise.all([getOverdueLoans(), getFineSettings()]);
  return loans.map((l) => ({
    loanId: l.loanId,
    bookTitle: l.bookTitle,
    barcode: l.barcode,
    dueDate: l.dueDate.toISOString(),
    patronName: l.patronName,
    studentCode: l.studentCode,
    daysOverdue: daysLate(l.dueDate, now),
    estimatedFine: daysLate(l.dueDate, now) * finePerDayVnd,
    hasEmail: Boolean(l.patronEmail),
  }));
}

export async function sendDueSoonReminders(): Promise<NotifySendResult> {
  const loans = await getDueSoonLoans();
  const smtpConfigured = isMailerConfigured();
  const skippedNoEmail = loans.filter((l) => !l.patronEmail).length;

  if (!smtpConfigured) {
    return { smtpConfigured, totalLoans: loans.length, sent: 0, skippedNoEmail, failed: 0 };
  }

  let sent = 0;
  let failed = 0;
  for (const loan of loans) {
    if (!loan.patronEmail) continue;
    const ok = await sendMail({
      to: loan.patronEmail,
      subject: `Nhắc trả sách: "${loan.bookTitle}" đến hạn vào ngày mai`,
      html: `
        <p>Chào ${loan.patronName} (${loan.studentCode}),</p>
        <p>Sách <strong>${loan.bookTitle}</strong> bạn đang mượn sẽ đến hạn trả vào ngày
        <strong>${loan.dueDate.toLocaleDateString("vi-VN")}</strong> (ngày mai).</p>
        <p>Vui lòng trả sách đúng hạn để tránh bị phạt trễ hạn.</p>
        <p>Trân trọng,<br/>Thư viện Đại Chủng Viện Phaolô Lê Bảo Tịnh</p>
      `,
    });
    if (ok) sent += 1;
    else failed += 1;
  }

  return { smtpConfigured, totalLoans: loans.length, sent, skippedNoEmail, failed };
}

export async function sendOverdueNotices(): Promise<NotifySendResult> {
  const now = new Date();
  const loans = await getOverdueLoans();
  const smtpConfigured = isMailerConfigured();
  const skippedNoEmail = loans.filter((l) => !l.patronEmail).length;

  if (!smtpConfigured) {
    return { smtpConfigured, totalLoans: loans.length, sent: 0, skippedNoEmail, failed: 0 };
  }

  const { finePerDayVnd } = await getFineSettings();
  let sent = 0;
  let failed = 0;
  for (const loan of loans) {
    if (!loan.patronEmail) continue;
    const overdueDays = daysLate(loan.dueDate, now);
    const estimatedFine = overdueDays * finePerDayVnd;
    const ok = await sendMail({
      to: loan.patronEmail,
      subject: `Sách "${loan.bookTitle}" đã quá hạn trả`,
      html: `
        <p>Chào ${loan.patronName} (${loan.studentCode}),</p>
        <p>Sách <strong>${loan.bookTitle}</strong> bạn mượn đã quá hạn trả <strong>${overdueDays} ngày</strong>
        (hạn trả: ${loan.dueDate.toLocaleDateString("vi-VN")}).</p>
        <p>Số tiền phạt ước tính: <strong>${estimatedFine.toLocaleString("vi-VN")}đ</strong>.</p>
        <p>Vui lòng trả sách sớm nhất có thể.</p>
        <p>Trân trọng,<br/>Thư viện Đại Chủng Viện Phaolô Lê Bảo Tịnh</p>
      `,
    });
    if (ok) sent += 1;
    else failed += 1;
  }

  return { smtpConfigured, totalLoans: loans.length, sent, skippedNoEmail, failed };
}
