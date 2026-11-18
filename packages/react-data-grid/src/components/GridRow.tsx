import type { ColumnDef } from "../types/grid";
import { GridCell } from "./GridCell";

export function GridRow<T>({
  row,
  columns,
  rowIndex,
}: {
  row: T;
  columns: readonly ColumnDef<T>[];
  rowIndex?: number;
}) {
  return (
    <tr aria-rowindex={rowIndex}>
      {columns.map((column) => (
        <GridCell key={column.key} row={row} column={column} />
      ))}
    </tr>
  );
}
