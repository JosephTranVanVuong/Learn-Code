import {
  AlignmentType,
  BorderStyle,
  Document,
  HeightRule,
  ImageRun,
  LineRuleType,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlignTable,
  WidthType,
  convertMillimetersToTwip,
} from "docx";
import JsBarcode from "jsbarcode";

// Khổ giấy Tomy 107 dọc — đo thủ công từ tờ giấy thật, xem HANDOFF.md để biết bối cảnh.
const SHEET_WIDTH_MM = 163;
const SHEET_HEIGHT_MM = 203;
const MARGIN_TOP_MM = 7;
const MARGIN_LEFT_MM = 3;
const LABEL_WIDTH_MM = 50;
const LABEL_HEIGHT_MM = 17;
const COL_GAP_MM = 3;
const ROW_GAP_MM = 2;
const COLS = 3;
const ROWS = 10;
const PER_PAGE = COLS * ROWS;
const MARGIN_RIGHT_MM = SHEET_WIDTH_MM - (MARGIN_LEFT_MM + COLS * LABEL_WIDTH_MM + (COLS - 1) * COL_GAP_MM);
const MARGIN_BOTTOM_MM = SHEET_HEIGHT_MM - (MARGIN_TOP_MM + ROWS * LABEL_HEIGHT_MM + (ROWS - 1) * ROW_GAP_MM);
const BARCODE_IMAGE_WIDTH_MM = 46;
const BARCODE_IMAGE_HEIGHT_MM = 8;
const LABEL_FONT_SIZE = 16; // half-points = 8pt
// Buộc chiều cao dòng đúng bằng cỡ chữ (thay vì giãn dòng mặc định của Word), tránh chữ tràn ra mép tem.
const TEXT_LINE_HEIGHT_TWIPS = 190; // ~9.5pt cho chữ cỡ 8pt
const TEXT_LINE_SPACING = { before: 0, after: 0, line: TEXT_LINE_HEIGHT_TWIPS, lineRule: LineRuleType.EXACT };

const NO_BORDER = { style: BorderStyle.NONE, size: 0 };
const NO_CELL_BORDERS = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER };
const NO_MARGINS = { top: 0, bottom: 0, left: 0, right: 0 };

export interface BarcodeLabelItem {
  barcode: string;
  location?: string | null;
}

function mmToTwip(mm: number): number {
  return convertMillimetersToTwip(mm);
}

function mmToPx(mm: number): number {
  return Math.round((mm / 25.4) * 96);
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] ?? "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function renderBarcodeImage(value: string): { data: Uint8Array; width: number; height: number } {
  const canvas = document.createElement("canvas");
  JsBarcode(canvas, value, {
    format: "CODE128",
    displayValue: false,
    margin: 0,
    width: 2,
    height: 60,
  });
  const targetWidthPx = mmToPx(BARCODE_IMAGE_WIDTH_MM);
  const targetHeightPx = mmToPx(BARCODE_IMAGE_HEIGHT_MM);
  const scale = Math.min(targetWidthPx / canvas.width, targetHeightPx / canvas.height);
  return {
    data: dataUrlToUint8Array(canvas.toDataURL("image/png")),
    width: Math.round(canvas.width * scale),
    height: Math.round(canvas.height * scale),
  };
}

function buildEmptyCell(widthMm: number, columnSpan?: number): TableCell {
  return new TableCell({
    width: { size: mmToTwip(widthMm), type: WidthType.DXA },
    columnSpan,
    borders: NO_CELL_BORDERS,
    margins: NO_MARGINS,
    children: [new Paragraph({ text: "" })],
  });
}

function buildLabelCell(item: BarcodeLabelItem | null): TableCell {
  if (!item) {
    return buildEmptyCell(LABEL_WIDTH_MM);
  }

  const image = renderBarcodeImage(item.barcode);

  return new TableCell({
    width: { size: mmToTwip(LABEL_WIDTH_MM), type: WidthType.DXA },
    verticalAlign: VerticalAlignTable.CENTER,
    borders: NO_CELL_BORDERS,
    margins: NO_MARGINS,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: TEXT_LINE_SPACING,
        children: [new TextRun({ text: item.barcode, size: LABEL_FONT_SIZE })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0 },
        children: [
          new ImageRun({
            type: "png",
            data: image.data,
            transformation: { width: image.width, height: image.height },
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: TEXT_LINE_SPACING,
        children: [new TextRun({ text: item.location || " ", size: LABEL_FONT_SIZE })],
      }),
    ],
  });
}

function buildPageTable(items: (BarcodeLabelItem | null)[]): Table {
  const totalWidthMm = COLS * LABEL_WIDTH_MM + (COLS - 1) * COL_GAP_MM;
  const columnWidths: number[] = [];
  for (let c = 0; c < COLS; c++) {
    columnWidths.push(mmToTwip(LABEL_WIDTH_MM));
    if (c < COLS - 1) columnWidths.push(mmToTwip(COL_GAP_MM));
  }

  const rows: TableRow[] = [];
  for (let r = 0; r < ROWS; r++) {
    const cells: TableCell[] = [];
    for (let c = 0; c < COLS; c++) {
      cells.push(buildLabelCell(items[r * COLS + c] ?? null));
      if (c < COLS - 1) cells.push(buildEmptyCell(COL_GAP_MM));
    }
    rows.push(
      new TableRow({ height: { value: mmToTwip(LABEL_HEIGHT_MM), rule: HeightRule.EXACT }, children: cells }),
    );
    if (r < ROWS - 1) {
      rows.push(
        new TableRow({
          height: { value: mmToTwip(ROW_GAP_MM), rule: HeightRule.EXACT },
          children: [buildEmptyCell(totalWidthMm, COLS * 2 - 1)],
        }),
      );
    }
  }

  return new Table({
    width: { size: mmToTwip(totalWidthMm), type: WidthType.DXA },
    columnWidths,
    layout: TableLayoutType.FIXED,
    borders: { ...NO_CELL_BORDERS, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
    rows,
  });
}

/** Sinh file .docx in nhãn mã vạch khớp khổ giấy Tomy 107 (163x203mm, 3 cột x 10 hàng = 30 tem/tờ). */
export async function generateBarcodeDocxBlob(items: BarcodeLabelItem[]): Promise<Blob> {
  const chunks: BarcodeLabelItem[][] = [];
  for (let i = 0; i < items.length; i += PER_PAGE) {
    chunks.push(items.slice(i, i + PER_PAGE));
  }
  if (chunks.length === 0) chunks.push([]);

  const sections = chunks.map((chunk) => {
    const padded: (BarcodeLabelItem | null)[] = [...chunk];
    while (padded.length < PER_PAGE) padded.push(null);
    return {
      properties: {
        page: {
          size: { width: mmToTwip(SHEET_WIDTH_MM), height: mmToTwip(SHEET_HEIGHT_MM) },
          margin: {
            top: mmToTwip(MARGIN_TOP_MM),
            left: mmToTwip(MARGIN_LEFT_MM),
            right: mmToTwip(MARGIN_RIGHT_MM),
            bottom: mmToTwip(MARGIN_BOTTOM_MM),
          },
        },
      },
      children: [buildPageTable(padded)],
    };
  });

  const doc = new Document({ sections });
  return Packer.toBlob(doc);
}
