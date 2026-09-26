import * as XLSX from "xlsx";
import type { OldSystemBookRow } from "./access-reader";

/**
 * Đọc file Excel "Danh sách tổng quát tác phẩm" xuất từ phần mềm thư viện cũ.
 * Định dạng cố định: dòng 1 = tiêu đề thư viện, dòng 2 = tên cột
 * (TThuTu | MaDocGia | TenTacPham | TacGia | NhaXuatBan | DDC | KyHieuTp | HienTrang),
 * từ dòng 3 trở đi mỗi dòng là 1 bản sao vật lý. Không có ISBN/mô tả/ngôn ngữ/năm xuất bản
 * trong định dạng này — dùng file Access (.accdb) nếu cần đầy đủ hơn.
 */
export function readOldSystemExcelBooks(buffer: Buffer): OldSystemBookRow[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = firstSheetName ? workbook.Sheets[firstSheetName] : undefined;
  if (!sheet) return [];

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
  const headerRow = rows[1]?.map((c) => String(c).trim());
  const looksValid = headerRow?.some((c) => c === "MaDocGia") && headerRow?.some((c) => c === "TenTacPham");
  if (!looksValid) {
    throw new Error(
      'File Excel không đúng định dạng "Danh sách tổng quát tác phẩm" của phần mềm thư viện cũ (thiếu cột MaDocGia/TenTacPham ở dòng tiêu đề).',
    );
  }

  const result: OldSystemBookRow[] = [];
  for (let i = 2; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length < 3) continue;
    const barcode = String(r[1] ?? "").trim();
    const title = String(r[2] ?? "").trim();
    if (!barcode || !title) continue;
    result.push({
      barcode,
      title,
      author: String(r[3] ?? "").trim() || null,
      authorMark: String(r[6] ?? "").trim() || null,
      publisher: String(r[4] ?? "").trim() || null,
      publishedYear: null,
      isbn: null,
      description: null,
      language: null,
      ddc: String(r[5] ?? "").trim() || null,
    });
  }
  return result;
}
