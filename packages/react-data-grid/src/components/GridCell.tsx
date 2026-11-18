import type { ComponentProps, ReactNode } from "react";
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

export function GridCell<T>({
  row,
  column,
  editor,
  ...attributes
}: {
  row: T;
  column: ColumnDef<T>;
  editor?: ReactNode;
} & Pick<ComponentProps<"td">, "id" | "role" | "aria-selected" | "className">) {
  const value = column.accessor ? column.accessor(row) : row[column.key];
  const text = formatCell(value);

  return (
    <td
      title={editor ? undefined : text}
      {...attributes}
      data-adg-editing={editor ? "" : undefined}
    >
      {editor ?? text}
    </td>
  );
}
