import { formatUtcDate, getCellText } from "./cellValue";
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
  const fields: string[] = [];
  const dates = new Map<number, string>();
  function cachedDate(value: Date) {
    const time = value.getTime();
    const cached = dates.get(time);
    if (cached !== undefined) return cached;
    const formatted = formatUtcDate(value);
    if (dates.size < 1024) dates.set(time, formatted);
    return formatted;
  }
  for (let index = range.startRow; index <= range.endRow; index++) {
    const row = rows[order?.[index] ?? index];
    for (let column = range.startColumn; column <= range.endColumn; column++) {
      fields[column - range.startColumn] = escapeField(
        getCellText(row, columns[column], cachedDate) ?? "",
      );
    }
    lines.push(fields.join("\t"));
  }
  return lines.join("\r\n");
}
