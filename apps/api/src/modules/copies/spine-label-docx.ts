import {
  AlignmentType,
  BorderStyle,
  Document,
  HeightRule,
  LineRuleType,
  PageOrientation,
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
import { SPINE_LABEL_SHEET } from "@thuvien/shared";

const {
  sheetWidthMm: SHEET_WIDTH_MM,
  sheetHeightMm: SHEET_HEIGHT_MM,
  marginTopMm: MARGIN_TOP_MM,
  marginLeftMm: MARGIN_LEFT_MM,
  labelWidthMm: LABEL_WIDTH_MM,
  labelHeightMm: LABEL_HEIGHT_MM,
  colGapMm: COL_GAP_MM,
  rowGapMm: ROW_GAP_MM,
  cols: COLS,
  rows: ROWS,
} = SPINE_LABEL_SHEET;

const PER_PAGE = COLS * ROWS;
const MARGIN_RIGHT_MM = SHEET_WIDTH_MM - (MARGIN_LEFT_MM + COLS * LABEL_WIDTH_MM + (COLS - 1) * COL_GAP_MM);
const MARGIN_BOTTOM_MM = SHEET_HEIGHT_MM - (MARGIN_TOP_MM + ROWS * LABEL_HEIGHT_MM + (ROWS - 1) * ROW_GAP_MM);

const CALL_NUMBER_FONT_SIZE = 24; // half-points = 12pt
const BARCODE_FONT_SIZE = 18; // half-points = 9pt
// Buộc chiều cao dòng đúng cỡ chữ (thay vì giãn dòng mặc định của Word) — bài học từ nhãn mã vạch.
const CALL_NUMBER_LINE_SPACING = { before: 0, after: 0, line: 280, lineRule: LineRuleType.EXACT }; // 14pt
const BARCODE_LINE_SPACING = { before: 0, after: 0, line: 220, lineRule: LineRuleType.EXACT }; // 11pt

const NO_BORDER = { style: BorderStyle.NONE, size: 0 };
const NO_CELL_BORDERS = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER };
const NO_MARGINS = { top: 0, bottom: 0, left: 0, right: 0 };

export interface SpineLabelItem {
  barcode: string;
  classificationNumber?: string | null;
  authorMark?: string | null;
}

function mmToTwip(mm: number): number {
  return convertMillimetersToTwip(mm);
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

function buildLabelCell(item: SpineLabelItem | null): TableCell {
  if (!item) {
    return buildEmptyCell(LABEL_WIDTH_MM);
  }

  return new TableCell({
    width: { size: mmToTwip(LABEL_WIDTH_MM), type: WidthType.DXA },
    verticalAlign: VerticalAlignTable.CENTER,
    borders: NO_CELL_BORDERS,
    margins: NO_MARGINS,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: CALL_NUMBER_LINE_SPACING,
        children: [new TextRun({ text: item.classificationNumber || "—", bold: true, size: CALL_NUMBER_FONT_SIZE })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: CALL_NUMBER_LINE_SPACING,
        children: [new TextRun({ text: item.authorMark || "—", size: CALL_NUMBER_FONT_SIZE })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: BARCODE_LINE_SPACING,
        children: [new TextRun({ text: item.barcode, size: BARCODE_FONT_SIZE })],
      }),
    ],
  });
}

function buildPageTable(items: (SpineLabelItem | null)[]): Table {
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

/** Sinh file .docx in nhãn gáy khớp khổ giấy Tomy A5 105 (xem SPINE_LABEL_SHEET trong packages/shared). */
export async function generateSpineLabelDocxBuffer(items: SpineLabelItem[]): Promise<Buffer> {
  const chunks: SpineLabelItem[][] = [];
  for (let i = 0; i < items.length; i += PER_PAGE) {
    chunks.push(items.slice(i, i + PER_PAGE));
  }
  if (chunks.length === 0) chunks.push([]);

  const sections = chunks.map((chunk) => {
    const padded: (SpineLabelItem | null)[] = [...chunk];
    while (padded.length < PER_PAGE) padded.push(null);
    return {
      properties: {
        page: {
          // docx hoán đổi width/height nội bộ khi orientation=LANDSCAPE (xem createPageSize trong thư viện),
          // nên phải truyền ngược lại ở đây để kết quả cuối cùng đúng bằng SHEET_WIDTH_MM × SHEET_HEIGHT_MM.
          size: {
            width: mmToTwip(SHEET_HEIGHT_MM),
            height: mmToTwip(SHEET_WIDTH_MM),
            orientation: PageOrientation.LANDSCAPE,
          },
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
  return Packer.toBuffer(doc);
}
