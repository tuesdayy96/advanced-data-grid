import type { CSSProperties } from "react";
import { HEADER_HEIGHT, ROW_HEIGHT } from "../core/virtualization";
import { useVirtualRows } from "../hooks/useVirtualRows";
import type { DataGridProps } from "../types/grid";
import { GridHeader } from "./GridHeader";
import { GridRow } from "./GridRow";

const fixedHeights = {
  "--adg-row-height": `${ROW_HEIGHT}px`,
  "--adg-header-height": `${HEADER_HEIGHT}px`,
} as CSSProperties;

function Spacer({
  height,
  columnCount,
}: {
  height: number;
  columnCount: number;
}) {
  if (height === 0) return null;
  return (
    <tr className="adg-spacer" aria-hidden="true">
      <td colSpan={columnCount} style={{ height }} />
    </tr>
  );
}

export function DataGrid<T extends object>({
  columns,
  rows,
  rowKey,
  className,
  height,
  "aria-label": label = "Data grid",
}: DataGridProps<T>) {
  const width = columns.reduce((total, column) => total + column.width, 0);
  const rowCount = columns.length > 0 ? rows.length : 0;
  const virtual =
    height !== undefined && height !== "" && height !== "auto" && rowCount > 0;
  const { containerRef, range } = useVirtualRows(virtual, rowCount, height);
  const startIndex = virtual ? range.startIndex : 0;
  const endIndex = virtual ? range.endIndex : rowCount;
  const renderedRows = [];

  for (let index = startIndex; index < endIndex; index++) {
    const row = rows[index];
    const key = typeof rowKey === "function" ? rowKey(row) : row[rowKey];
    renderedRows.push(
      <GridRow
        key={`${typeof key}:${key}`}
        row={row}
        columns={columns}
        rowIndex={virtual ? index + 2 : undefined}
      />,
    );
  }

  return (
    <div
      ref={containerRef}
      className={`adg-root${virtual ? " adg-virtual" : ""}${className ? ` ${className}` : ""}`}
      style={virtual ? { ...fixedHeights, height } : { height }}
    >
      <table
        className="adg-table"
        aria-label={label}
        aria-rowcount={virtual ? rowCount + 1 : undefined}
        style={{ width }}
      >
        <colgroup>
          {columns.map((column) => (
            <col key={column.key} style={{ width: column.width }} />
          ))}
        </colgroup>
        <GridHeader columns={columns} rowIndex={virtual ? 1 : undefined} />
        <tbody>
          {virtual && (
            <Spacer height={range.topPadding} columnCount={columns.length} />
          )}
          {renderedRows}
          {virtual && (
            <Spacer height={range.bottomPadding} columnCount={columns.length} />
          )}
        </tbody>
      </table>
      {rows.length === 0 && (
        <p className="adg-empty" role="status">
          No rows to display.
        </p>
      )}
    </div>
  );
}
