import * as bwipjs from "bwip-js";
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
import { BARCODE_LABEL_SHEET } from "@thuvien/shared";

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
} = BARCODE_LABEL_SHEET;

const PER_PAGE = COLS * ROWS;
const MARGIN_RIGHT_MM = SHEET_WIDTH_MM - (MARGIN_LEFT_MM + COLS * LABEL_WIDTH_MM + (COLS - 1) * COL_GAP_MM);
const MARGIN_BOTTOM_MM = SHEET_HEIGHT_MM - (MARGIN_TOP_MM + ROWS * LABEL_HEIGHT_MM + (ROWS - 1) * ROW_GAP_MM);
const BARCODE_IMAGE_WIDTH_MM = 46;
const BARCODE_IMAGE_HEIGHT_MM = 8;
const LABEL_FONT_SIZE = 16; // half-points = 8pt
const TEXT_LINE_HEIGHT_TWIPS = 190; // ~9.5pt cho chữ cỡ 8pt — tránh giãn dòng mặc định của Word làm tràn mép
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

/** Đọc width/height (px) từ IHDR chunk của PNG — theo đúng cấu trúc chuẩn PNG (offset cố định). */
function readPngDimensions(png: Buffer): { width: number; height: number } {
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

async function renderBarcodeImage(value: string): Promise<{ data: Buffer; width: number; height: number }> {
  const png = await bwipjs.toBuffer({
    bcid: "code128",
    text: value,
    height: BARCODE_IMAGE_HEIGHT_MM,
    includetext: false,
    scale: 3,
  });
  const { width: pxW, height: pxH } = readPngDimensions(png);
  const naturalWidthMm = (BARCODE_IMAGE_HEIGHT_MM * pxW) / pxH;
  const fitScale = Math.min(1, BARCODE_IMAGE_WIDTH_MM / naturalWidthMm);
  const widthMm = naturalWidthMm * fitScale;
  const heightMm = BARCODE_IMAGE_HEIGHT_MM * fitScale;
  return { data: png, width: mmToPx(widthMm), height: mmToPx(heightMm) };
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

async function buildLabelCell(item: BarcodeLabelItem | null): Promise<TableCell> {
  if (!item) {
    return buildEmptyCell(LABEL_WIDTH_MM);
  }

  const image = await renderBarcodeImage(item.barcode);

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

async function buildPageTable(items: (BarcodeLabelItem | null)[]): Promise<Table> {
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
      cells.push(await buildLabelCell(items[r * COLS + c] ?? null));
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

/** Sinh file .docx in nhãn mã vạch khớp khổ giấy Tomy 107 (xem BARCODE_LABEL_SHEET trong packages/shared). */
export async function generateBarcodeDocxBuffer(items: BarcodeLabelItem[]): Promise<Buffer> {
  const chunks: BarcodeLabelItem[][] = [];
  for (let i = 0; i < items.length; i += PER_PAGE) {
    chunks.push(items.slice(i, i + PER_PAGE));
  }
  if (chunks.length === 0) chunks.push([]);

  const sections = await Promise.all(
    chunks.map(async (chunk) => {
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
        children: [await buildPageTable(padded)],
      };
    }),
  );

  const doc = new Document({
    styles: { default: { document: { run: { font: "Roboto" } } } },
    sections,
  });
  return Packer.toBuffer(doc);
}
