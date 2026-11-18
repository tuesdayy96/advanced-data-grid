import type { ColumnDef } from "../types/grid";

function formatCell(value: unknown): string {
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
  return "—";
}

export function GridCell<T>({ row, column }: { row: T; column: ColumnDef<T> }) {
  const value = column.accessor ? column.accessor(row) : row[column.key];
  const text = formatCell(value);

  return <td title={text}>{text}</td>;
}
