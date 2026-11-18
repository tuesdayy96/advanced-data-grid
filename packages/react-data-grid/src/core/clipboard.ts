import { getCellText } from "./cellValue";
import type { getSelectionRange } from "./selection";
import type { ColumnDef } from "../types/grid";

function escapeField(text: string) {
  return /[\t\r\n"]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function serializeSelection<T>(
  rows: readonly T[],
  columns: readonly ColumnDef<T>[],
  order: readonly number[] | undefined,
  range: ReturnType<typeof getSelectionRange>,
) {
  const lines: string[] = [];
  for (let index = range.startRow; index <= range.endRow; index++) {
    const row = rows[order?.[index] ?? index];
    const fields: string[] = [];
    for (let column = range.startColumn; column <= range.endColumn; column++) {
      fields.push(escapeField(getCellText(row, columns[column]) ?? ""));
    }
    lines.push(fields.join("\t"));
  }
  return lines.join("\r\n");
}
