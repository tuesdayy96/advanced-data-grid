import type { ColumnDef } from "../types/grid";

export function getCellText<T>(
  row: T,
  column: ColumnDef<T>,
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
    return value.toISOString().split("T")[0];
  }
}
