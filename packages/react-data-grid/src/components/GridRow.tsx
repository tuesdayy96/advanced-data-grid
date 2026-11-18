import type { ReactNode } from "react";
import {
  isCellSelected,
  sameCell,
  type CellPosition,
  type getSelectionRange,
} from "../core/selection";
import { getCellId } from "../hooks/useGridSelection";
import type { ColumnDef } from "../types/grid";
import { GridCell } from "./GridCell";

export function GridRow<T>({
  row,
  columns,
  rowIndex,
  index,
  interaction,
  editor,
}: {
  row: T;
  columns: readonly ColumnDef<T>[];
  rowIndex?: number;
  index: number;
  editor?: { columnIndex: number; content: ReactNode };
  interaction?: {
    gridId: string;
    active?: CellPosition;
    range?: ReturnType<typeof getSelectionRange>;
  };
}) {
  return (
    <tr aria-rowindex={rowIndex} data-adg-row={interaction ? index : undefined}>
      {columns.map((column, columnIndex) => {
        const cell = { rowIndex: index, columnIndex };
        return (
          <GridCell
            key={column.key}
            row={row}
            column={column}
            editor={
              editor?.columnIndex === columnIndex ? editor.content : undefined
            }
            role={interaction ? "gridcell" : undefined}
            id={interaction ? getCellId(interaction.gridId, cell) : undefined}
            aria-selected={
              interaction
                ? !!interaction.range && isCellSelected(cell, interaction.range)
                : undefined
            }
            className={
              interaction?.active && sameCell(cell, interaction.active)
                ? "adg-active"
                : undefined
            }
          />
        );
      })}
    </tr>
  );
}
