import type { ColumnDef } from "../types/grid";

export type EditorKind = NonNullable<ColumnDef<object>["editor"]>;

export function sameValue(a: unknown, b: unknown) {
  return a instanceof Date && b instanceof Date
    ? Object.is(a.getTime(), b.getTime())
    : Object.is(a, b);
}

export function getEditValue<T extends object>(
  column: ColumnDef<T>,
  row: T,
): unknown {
  return column.valueGetter
    ? column.valueGetter(row)
    : Reflect.get(row, column.key);
}

export function isEditable<T extends object>(column: ColumnDef<T>, row: T) {
  if (
    !column.editable ||
    (typeof column.editable === "function" && !column.editable(row))
  )
    return false;
  if (
    column.accessor &&
    !(column.key in row) &&
    !(column.valueGetter && column.valueParser)
  )
    return false;

  return true;
}

export function getEditor<T extends object>(column: ColumnDef<T>, row: T) {
  if (!isEditable(column, row)) return null;

  const original = getEditValue(column, row);
  const kind =
    column.editor ??
    (original instanceof Date
      ? "date"
      : typeof original === "number"
        ? "number"
        : "text");
  if (!column.valueParser && original != null) {
    if (kind === "text" && typeof original !== "string") return null;
    if (kind === "number" && typeof original !== "number") return null;
    if (
      kind === "date" &&
      !(original instanceof Date) &&
      !(typeof original === "string" && /^\d{4}-\d{2}-\d{2}$/.test(original))
    )
      return null;
  }
  const initial =
    original instanceof Date
      ? Number.isFinite(original.getTime())
        ? original.toISOString().split("T")[0]
        : ""
      : typeof original === "string" || typeof original === "number"
        ? String(original)
        : "";

  return { kind, original, initial };
}

type Result = { value: unknown } | { error: string };

export function parseEdit<T>(
  draft: string,
  kind: EditorKind,
  original: unknown,
  column: ColumnDef<T>,
  row: T,
): Result {
  let value: unknown = draft;

  if (column.valueParser) {
    try {
      value = column.valueParser(draft, row);
    } catch (error) {
      return {
        error:
          error instanceof Error && error.message
            ? error.message
            : "The value could not be parsed.",
      };
    }
  } else if (kind === "number") {
    const input = draft.trim();
    if (
      !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(input) ||
      !Number.isFinite(Number(input))
    )
      return { error: "Enter a valid number." };
    value = Number(input);
  } else if (kind === "date") {
    const date = new Date(`${draft}T00:00:00.000Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(draft) ||
      !Number.isFinite(date.getTime()) ||
      date.toISOString().split("T")[0] !== draft
    )
      return { error: "Enter a valid date." };
    if (original instanceof Date) {
      if (Number.isFinite(original.getTime())) {
        date.setUTCHours(
          original.getUTCHours(),
          original.getUTCMinutes(),
          original.getUTCSeconds(),
          original.getUTCMilliseconds(),
        );
      }
      value = date;
    }
  }

  const validation = column.validate?.(value, row);
  if (validation === false || typeof validation === "string") {
    return { error: validation || "This value is not allowed." };
  }
  return { value };
}
