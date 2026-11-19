import type { ColumnDef } from "../types/grid";

export function getCellText<T>(
  row: T,
  column: ColumnDef<T>,
  formatDate = formatUtcDate,
): string | undefined {
  const value = column.accessor ? column.accessor(row) : row[column.key];
  if (typeof value === "string") return value;
  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return formatDate(value);
  }
}

export function formatUtcDate(value: Date) {
  const iso = value.toISOString();
  return iso.slice(0, iso.indexOf("T"));
}
