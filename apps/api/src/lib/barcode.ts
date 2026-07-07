export function generateBarcode(bookId: string, index: number, prefix?: string | null): string {
  const base = `${bookId.slice(-6).toUpperCase()}-${index}`;
  return prefix ? `${prefix}-${base}` : base;
}
