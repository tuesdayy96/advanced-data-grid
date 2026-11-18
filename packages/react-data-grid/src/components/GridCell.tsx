import { getCellText } from "../core/cellValue";
import type { ColumnPin } from "../types/grid";
import type { ComponentProps, ReactNode } from "react";
import type { ColumnDef } from "../types/grid";

export function GridCell<T>({
  row,
  column,
  editor,
  logicalIndex,
  pin,
  offset,
  boundary,
  ...attributes
}: {
  row: T;
  column: ColumnDef<T>;
  editor?: ReactNode;
  logicalIndex?: number;
  pin?: ColumnPin;
  offset?: number;
  boundary?: boolean;
} & Pick<ComponentProps<"td">, "id" | "role" | "aria-selected" | "className">) {
  const text = getCellText(row, column) ?? "\u2014";

  return (
    <td
      title={editor ? undefined : text}
      {...attributes}
      data-adg-column={logicalIndex}
      data-pin={pin}
      data-pin-boundary={boundary || undefined}
      style={pin ? { [pin]: offset } : undefined}
      data-adg-editing={editor ? "" : undefined}
    >
      {editor ?? text}
    </td>
  );
}
