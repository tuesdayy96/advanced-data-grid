import type { CSSProperties, KeyboardEvent, MouseEvent } from "react";
import {
  getKeyboardDestination,
  getSelectionRange,
  sameCell,
  type CellPosition,
} from "../core/selection";
import { useGridEditing } from "../hooks/useGridEditing";
import {
  getCellId,
  getCellPosition,
  useGridSelection,
} from "../hooks/useGridSelection";
import { HEADER_HEIGHT, ROW_HEIGHT } from "../core/virtualization";
import { useVirtualRows } from "../hooks/useVirtualRows";
import type { DataGridProps } from "../types/grid";
import { CellEditor } from "./editors/CellEditor";
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
  enableSelection = false,
  enableEditing = false,
  onCellChange,
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
  const selection = useGridSelection(
    enableSelection,
    { rowCount, columnCount: columns.length },
    containerRef,
    revealCell,
  );
  const editingEnabled = enableSelection && enableEditing;
  const editing = useGridEditing(
    { rows, columns, rowKey, onCellChange },
    editingEnabled,
    startIndex,
    endIndex,
    finishNavigation,
  );
  const session = editing.editing;
  const errorId = `${selection.gridId}-edit-error`;
  const active = selection.activeSelection?.active;
  const gridSize = { rowCount, columnCount: columns.length };

  function finishNavigation(cell?: CellPosition, reverseTab?: boolean) {
    const table = selection.tableRef.current;
    const focused = table?.ownerDocument.activeElement;
    if (
      table &&
      (focused === table.ownerDocument.body || table.contains(focused ?? null))
    ) {
      table.focus({ preventScroll: true });
    }
    if (!cell) return false;
    const destination = getKeyboardDestination(
      cell,
      gridSize,
      "Tab",
      !!reverseTab,
      false,
    );
    if (!destination) return false;
    selection.select(destination, false);
    revealCell(destination);
    return true;
  }

  function onKeyDown(event: KeyboardEvent<HTMLTableElement>) {
    if (
      session ||
      event.defaultPrevented ||
      event.nativeEvent.isComposing ||
      event.keyCode === 229
    )
      return;
    if (
      active &&
      (event.key === "Enter" || event.key === "F2") &&
      !event.shiftKey &&
      !event.ctrlKey &&
      !event.altKey &&
      !event.metaKey &&
      editing.start(active)
    ) {
      event.preventDefault();
      return;
    }
    selection.onKeyDown(event);
  }

  function onDoubleClick(event: MouseEvent<HTMLTableElement>) {
    const cell = getCellPosition(event.target, event.currentTarget);
    if (!cell || !editing.start(cell)) return;
    if (!active || !sameCell(cell, active)) selection.select(cell, false);
  }
  const activeId =
    !session &&
    active &&
    active.rowIndex >= startIndex &&
    active.rowIndex < endIndex
      ? getCellId(selection.gridId, active)
      : undefined;
  const interaction = enableSelection
    ? {
        gridId: selection.gridId,
        active,
        range: selection.activeSelection
          ? getSelectionRange(selection.activeSelection)
          : undefined,
      }
    : undefined;

  function revealCell(cell: CellPosition) {
    const container = containerRef.current;
    if (!container) return;

    if (!virtual) {
      const row = selection.tableRef.current?.tBodies[0]?.rows[cell.rowIndex];
      row?.cells[cell.columnIndex]?.scrollIntoView?.({
        block: "nearest",
        inline: "nearest",
      });
      return;
    }

    const viewport = container.clientHeight - HEADER_HEIGHT;
    const top = cell.rowIndex * ROW_HEIGHT;
    const bottom = top + ROW_HEIGHT;
    if (top < container.scrollTop) container.scrollTop = top;
    else if (viewport > 0 && bottom > container.scrollTop + viewport) {
      container.scrollTop = viewport < ROW_HEIGHT ? top : bottom - viewport;
    }

    let left = 0;
    for (let index = 0; index < cell.columnIndex; index++)
      left += columns[index].width;
    const right = left + columns[cell.columnIndex].width;
    if (
      left < container.scrollLeft ||
      columns[cell.columnIndex].width > container.clientWidth
    )
      container.scrollLeft = left;
    else if (right > container.scrollLeft + container.clientWidth)
      container.scrollLeft = right - container.clientWidth;
  }

  const renderedRows = [];

  for (let index = startIndex; index < endIndex; index++) {
    const row = rows[index];
    const key = typeof rowKey === "function" ? rowKey(row) : row[rowKey];
    renderedRows.push(
      <GridRow
        key={`${typeof key}:${key}`}
        row={row}
        columns={columns}
        index={index}
        interaction={interaction}
        editor={
          session?.cell.rowIndex === index
            ? {
                columnIndex: session.cell.columnIndex,
                content: (
                  <CellEditor
                    kind={session.kind}
                    defaultValue={session.initial}
                    aria-label={`Edit ${columns[session.cell.columnIndex]?.header ?? "cell"}`}
                    aria-invalid={editing.error ? true : undefined}
                    aria-describedby={editing.error ? errorId : undefined}
                    onChange={(event) =>
                      editing.updateDraft(event.currentTarget.value)
                    }
                    onKeyDown={editing.onEditorKeyDown}
                    onBlur={editing.onBlur}
                  />
                ),
              }
            : undefined
        }
        rowIndex={virtual || enableSelection ? index + 2 : undefined}
      />,
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className={`adg-root${virtual ? " adg-virtual" : ""}${className ? ` ${className}` : ""}`}
        style={virtual ? { ...fixedHeights, height } : { height }}
      >
        <table
          ref={selection.tableRef}
          className="adg-table"
          role={enableSelection ? "grid" : undefined}
          tabIndex={enableSelection && rowCount > 0 ? 0 : undefined}
          aria-activedescendant={activeId}
          aria-multiselectable={enableSelection ? true : undefined}
          onClick={enableSelection && !session ? selection.onClick : undefined}
          onDoubleClick={editingEnabled ? onDoubleClick : undefined}
          onFocus={enableSelection && !session ? selection.onFocus : undefined}
          onKeyDown={enableSelection ? onKeyDown : undefined}
          onPointerDown={
            enableSelection && !session ? selection.onPointerDown : undefined
          }
          onPointerMove={enableSelection ? selection.onPointerMove : undefined}
          onPointerLeave={
            enableSelection ? selection.onPointerLeave : undefined
          }
          aria-label={label}
          aria-rowcount={virtual || enableSelection ? rowCount + 1 : undefined}
          style={{ width }}
        >
          <colgroup>
            {columns.map((column) => (
              <col key={column.key} style={{ width: column.width }} />
            ))}
          </colgroup>
          <GridHeader
            columns={columns}
            rowIndex={virtual || enableSelection ? 1 : undefined}
          />
          <tbody>
            {virtual && (
              <Spacer height={range.topPadding} columnCount={columns.length} />
            )}
            {renderedRows}
            {virtual && (
              <Spacer
                height={range.bottomPadding}
                columnCount={columns.length}
              />
            )}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="adg-empty" role="status">
            No rows to display.
          </p>
        )}
      </div>
      {editing.error && (
        <p className="adg-edit-error" id={errorId} role="alert">
          {editing.error}
        </p>
      )}
    </>
  );
}
