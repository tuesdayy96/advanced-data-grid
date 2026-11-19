import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { serializeSelection } from "../core/clipboard";
import { revealColumn } from "../core/columnLayout";
import { useColumnLayout } from "../hooks/useColumnLayout";
import { filterRows, getNextSorting, sortRows } from "../core/processing";
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
import type {
  ColumnFilter,
  DataGridProps,
  SortDescriptor,
} from "../types/grid";
import { FilterPanel } from "./FilterPanel";
import { CellEditor } from "./editors/CellEditor";
import { GridHeader } from "./GridHeader";
import { GridRow } from "./GridRow";

const noFilters: readonly ColumnFilter[] = [];
const noSorting: readonly SortDescriptor[] = [];

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
  enableSorting = false,
  enableFiltering = false,
  enableClipboard = false,
  enableColumnResize = false,
  enableColumnPinning = true,
  onColumnResize,
  showColumnDividers = false,
  searchQuery = "",
  onSortChange,
  onFilterChange,
  height,
  "aria-label": label = "Data grid",
}: DataGridProps<T>) {
  const [copyFailed, setCopyFailed] = useState(false);
  const copyAttempt = useRef(0);
  const copyHandler = useRef<(event: ClipboardEvent) => void>(null);
  const [sorting, setSorting] = useState<readonly SortDescriptor[]>(noSorting);
  const [filters, setFilters] = useState<readonly ColumnFilter[]>(noFilters);
  const [openFilterKey, setOpenFilterKey] = useState<string>();
  const filterTrigger = useRef<HTMLButtonElement | null>(null);
  const activeFilters = enableFiltering ? filters : noFilters;
  const activeSorting = enableSorting ? sorting : noSorting;
  const filtered = useMemo(
    () => filterRows(rows, columns, activeFilters, searchQuery),
    [rows, columns, activeFilters, searchQuery],
  );
  const order = useMemo(
    () => sortRows(rows, columns, activeSorting, filtered),
    [rows, columns, activeSorting, filtered],
  );
  const view = useMemo(
    () => ({
      order,
      columnKeys: columns.map(({ key }) => key),
      getKey(index: number) {
        const originalIndex = order ? order[index] : index;
        const row = rows[originalIndex];
        return (
          row && (typeof rowKey === "function" ? rowKey(row) : row[rowKey])
        );
      },
    }),
    [order, columns, rows, rowKey],
  );
  const originalIndex = (index: number) => (order ? order[index] : index);
  const rowCount = columns.length > 0 ? (order?.length ?? rows.length) : 0;
  const openColumn = enableFiltering
    ? columns.find(
        ({ key, filterable }) => key === openFilterKey && filterable !== false,
      )
    : undefined;
  const virtual =
    height !== undefined && height !== "" && height !== "auto" && rowCount > 0;
  const { containerRef, range } = useVirtualRows(virtual, rowCount, height);
  const columnLayout = useColumnLayout(
    columns,
    containerRef,
    enableColumnResize,
    enableColumnPinning,
    onColumnResize,
  );
  const { layout } = columnLayout;
  const startIndex = virtual ? range.startIndex : 0;
  const endIndex = virtual ? range.endIndex : rowCount;
  const selection = useGridSelection(
    enableSelection,
    { rowCount, columnCount: columns.length },
    containerRef,
    revealCell,
    view,
  );
  const editingEnabled = enableSelection && enableEditing;
  const editing = useGridEditing(
    { rows, columns, rowKey, onCellChange },
    editingEnabled,
    startIndex,
    endIndex,
    finishNavigation,
    originalIndex,
    order,
  );
  const session = editing.editing;
  const filterPanelId = `${selection.gridId}-filter`;
  const errorId = `${selection.gridId}-edit-error`;
  const active = selection.activeSelection?.active;
  const gridSize = { rowCount, columnCount: columns.length };

  function closeFilter() {
    setOpenFilterKey(undefined);
    filterTrigger.current?.focus({ preventScroll: true });
  }

  function handleSort(key: string, multiple: boolean) {
    editing.commitViewChange();
    const next = getNextSorting(activeSorting, key, multiple);
    setOpenFilterKey(undefined);
    setSorting(next);
    onSortChange?.(next);
  }

  function handleFilter(key: string, event: MouseEvent<HTMLButtonElement>) {
    if (openColumn?.key === key) {
      closeFilter();
    } else {
      editing.commitViewChange();
      filterTrigger.current = event.currentTarget;
      setOpenFilterKey(key);
    }
  }

  function updateFilters(next: readonly ColumnFilter[]) {
    editing.commitViewChange();
    setFilters(next);
    onFilterChange?.(next);
  }

  function applyFilter(next?: ColumnFilter) {
    if (!openColumn) return;
    const remaining = activeFilters.filter(
      ({ columnKey }) => columnKey !== openColumn.key,
    );
    if (next || remaining.length !== activeFilters.length)
      updateFilters(next ? [...remaining, next] : remaining);
    closeFilter();
  }

  function skipHeaderControls() {
    const buttons =
      selection.tableRef.current?.tHead?.querySelectorAll("button");
    if (buttons?.length)
      buttons[buttons.length - 1].focus({ preventScroll: true });
  }

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
    if (!destination) {
      if (!reverseTab) skipHeaderControls();
      return false;
    }
    selection.select(destination, false);
    revealCell(destination);
    return true;
  }

  function onKeyDown(event: KeyboardEvent<HTMLTableElement>) {
    if (
      session ||
      event.target !== event.currentTarget ||
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
    if (
      event.key === "Tab" &&
      !event.shiftKey &&
      !event.defaultPrevented &&
      active
    )
      skipHeaderControls();
  }

  function onDoubleClick(event: MouseEvent<HTMLTableElement>) {
    const cell = getCellPosition(event.target, event.currentTarget);
    if (!cell || !editing.start(cell)) return;
    if (!active || !sameCell(cell, active)) selection.select(cell, false);
  }
  const reportRowCount = virtual || enableSelection || order !== undefined;
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

  useEffect(() => {
    copyHandler.current = onCopy;
  });

  const { tableRef } = selection;
  useEffect(() => {
    if (!enableSelection || !enableClipboard || !tableRef.current) return;
    const owner = tableRef.current.ownerDocument;
    const handleCopy = (event: ClipboardEvent) => copyHandler.current?.(event);
    owner.addEventListener("copy", handleCopy);
    return () => {
      owner.removeEventListener("copy", handleCopy);
      copyAttempt.current++;
    };
  }, [enableSelection, enableClipboard, tableRef]);

  function onCopy(event: ClipboardEvent) {
    const table = tableRef.current;
    const range = interaction?.range;
    if (
      session ||
      !range ||
      !table ||
      event.defaultPrevented ||
      table.ownerDocument.activeElement !== table
    )
      return;
    const attempt = ++copyAttempt.current;
    const text = serializeSelection(rows, columns, order, range);
    event.preventDefault();
    setCopyFailed(false);

    try {
      if (event.clipboardData) {
        event.clipboardData.setData("text/plain", text);
        return;
      }
    } catch {
      // The async API can still be available when event data is read-only.
    }

    const clipboard = table.ownerDocument.defaultView?.navigator.clipboard;
    if (!clipboard?.writeText) {
      setCopyFailed(true);
      return;
    }
    clipboard.writeText(text).catch(() => {
      if (attempt === copyAttempt.current) setCopyFailed(true);
    });
  }

  function revealCell(cell: CellPosition) {
    const container = containerRef.current;
    if (!container) return;

    const entry = layout.byIndex[cell.columnIndex];
    if (!entry) return;
    const scrollLeft = container.scrollLeft;
    if (virtual) {
      const viewport = container.clientHeight - HEADER_HEIGHT;
      const top = cell.rowIndex * ROW_HEIGHT;
      const bottom = top + ROW_HEIGHT;
      if (top < container.scrollTop) container.scrollTop = top;
      else if (viewport > 0 && bottom > container.scrollTop + viewport) {
        container.scrollTop = viewport < ROW_HEIGHT ? top : bottom - viewport;
      }
    } else {
      const row = selection.tableRef.current?.tBodies[0]?.rows[cell.rowIndex];
      row?.cells[entry.visualIndex]?.scrollIntoView?.({
        block: "nearest",
        inline: "nearest",
      });
      if (!layout.leftWidth && !layout.rightWidth) return;
    }
    container.scrollLeft = revealColumn(
      entry,
      scrollLeft,
      container.clientWidth,
      layout.leftWidth,
      layout.rightWidth,
    );
  }

  const renderedRows = [];

  for (let index = startIndex; index < endIndex; index++) {
    const row = rows[originalIndex(index)];
    const key = typeof rowKey === "function" ? rowKey(row) : row[rowKey];
    renderedRows.push(
      <GridRow
        key={`${typeof key}:${key}`}
        row={row}
        columns={layout.ordered}
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
        rowIndex={reportRowCount ? index + 2 : undefined}
      />,
    );
  }

  return (
    <>
      {activeFilters.length > 0 && (
        <button
          className="adg-clear-filters"
          type="button"
          onClick={() => {
            updateFilters(noFilters);
            if (openColumn) closeFilter();
            else
              selection.tableRef.current?.tHead
                ?.querySelector("button")
                ?.focus({ preventScroll: true });
          }}
        >
          Clear all filters
        </button>
      )}
      {openColumn && (
        <FilterPanel
          key={openColumn.key}
          id={filterPanelId}
          columnKey={openColumn.key}
          header={openColumn.header}
          kind={openColumn.filterType ?? "text"}
          filter={activeFilters.find(
            ({ columnKey, kind }) =>
              columnKey === openColumn.key &&
              kind === (openColumn.filterType ?? "text"),
          )}
          onApply={applyFilter}
          onClose={closeFilter}
        />
      )}
      <div
        ref={containerRef}
        tabIndex={enableSelection && rowCount > 0 ? -1 : undefined}
        className={`adg-root${virtual ? " adg-virtual" : ""}${className ? ` ${className}` : ""}`}
        style={virtual ? { ...fixedHeights, height } : { height }}
        data-resizing={columnLayout.resizing || undefined}
      >
        <table
          ref={selection.tableRef}
          className={
            showColumnDividers ? "adg-table adg-column-dividers" : "adg-table"
          }
          role={enableSelection ? "grid" : undefined}
          tabIndex={enableSelection && rowCount > 0 ? 0 : undefined}
          aria-activedescendant={activeId}
          aria-multiselectable={enableSelection ? true : undefined}
          onClick={enableSelection && !session ? selection.onClick : undefined}
          onDoubleClick={editingEnabled ? onDoubleClick : undefined}
          onFocus={
            enableSelection && !session
              ? (event) => {
                  if (event.target === event.currentTarget) selection.onFocus();
                }
              : undefined
          }
          onKeyDown={enableSelection ? onKeyDown : undefined}
          onPointerDown={
            enableSelection && !session ? selection.onPointerDown : undefined
          }
          onPointerMove={enableSelection ? selection.onPointerMove : undefined}
          onPointerLeave={
            enableSelection ? selection.onPointerLeave : undefined
          }
          aria-label={label}
          aria-rowcount={reportRowCount ? rowCount + 1 : undefined}
          style={{ width: layout.width }}
        >
          <colgroup>
            {layout.ordered.map(({ column, width }) => (
              <col key={column.key} style={{ width }} />
            ))}
          </colgroup>
          <GridHeader
            columns={layout.ordered}
            sorting={activeSorting}
            filters={activeFilters}
            onResizeStart={
              enableColumnResize ? columnLayout.startResize : undefined
            }
            onResizeBy={enableColumnResize ? columnLayout.resizeBy : undefined}
            onSort={enableSorting ? handleSort : undefined}
            onFilter={enableFiltering ? handleFilter : undefined}
            filterPanel={
              openColumn
                ? { key: openColumn.key, id: filterPanelId }
                : undefined
            }
            rowIndex={reportRowCount ? 1 : undefined}
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
        {(rows.length === 0 || order?.length === 0) && (
          <p className="adg-empty" role="status">
            {rows.length
              ? "No rows match the current filters or search."
              : "No rows to display."}
          </p>
        )}
      </div>
      {enableClipboard && copyFailed && (
        <p className="adg-edit-error" role="alert">
          Could not copy the selected cells.
        </p>
      )}
      {editing.error && (
        <p className="adg-edit-error" id={errorId} role="alert">
          {editing.error}
        </p>
      )}
    </>
  );
}
