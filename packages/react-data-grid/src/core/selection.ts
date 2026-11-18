export interface CellPosition {
  rowIndex: number;
  columnIndex: number;
}

export interface CellSelection {
  active: CellPosition;
  anchor: CellPosition;
}

export interface GridSize {
  rowCount: number;
  columnCount: number;
}

export function isCellInGrid(
  cell: CellPosition,
  { rowCount, columnCount }: GridSize,
) {
  return (
    Number.isInteger(cell.rowIndex) &&
    Number.isInteger(cell.columnIndex) &&
    cell.rowIndex >= 0 &&
    cell.rowIndex < rowCount &&
    cell.columnIndex >= 0 &&
    cell.columnIndex < columnCount
  );
}

export function sameCell(a: CellPosition, b: CellPosition) {
  return a.rowIndex === b.rowIndex && a.columnIndex === b.columnIndex;
}

export function getSelectionRange({ anchor, active }: CellSelection) {
  return {
    startRow: Math.min(anchor.rowIndex, active.rowIndex),
    endRow: Math.max(anchor.rowIndex, active.rowIndex),
    startColumn: Math.min(anchor.columnIndex, active.columnIndex),
    endColumn: Math.max(anchor.columnIndex, active.columnIndex),
  };
}

export function isCellSelected(
  cell: CellPosition,
  range: ReturnType<typeof getSelectionRange>,
) {
  return (
    cell.rowIndex >= range.startRow &&
    cell.rowIndex <= range.endRow &&
    cell.columnIndex >= range.startColumn &&
    cell.columnIndex <= range.endColumn
  );
}

export function getKeyboardDestination(
  origin: CellPosition,
  { rowCount, columnCount }: GridSize,
  key: string,
  shift: boolean,
  ctrl: boolean,
): CellPosition | null {
  let { rowIndex, columnIndex } = origin;
  switch (key) {
    case "ArrowUp":
      rowIndex--;
      break;
    case "ArrowDown":
      rowIndex++;
      break;
    case "ArrowLeft":
      columnIndex--;
      break;
    case "ArrowRight":
      columnIndex++;
      break;
    case "Enter":
      rowIndex += shift ? -1 : 1;
      break;
    case "Home":
      columnIndex = 0;
      if (ctrl) rowIndex = 0;
      break;
    case "End":
      columnIndex = columnCount - 1;
      if (ctrl) rowIndex = rowCount - 1;
      break;
    case "Tab": {
      const next = rowIndex * columnCount + columnIndex + (shift ? -1 : 1);
      if (next < 0 || next >= rowCount * columnCount) return null;
      rowIndex = Math.floor(next / columnCount);
      columnIndex = next % columnCount;
      break;
    }
    default:
      return null;
  }
  if (!rowCount || !columnCount) return null;
  return {
    rowIndex: Math.max(0, Math.min(rowCount - 1, rowIndex)),
    columnIndex: Math.max(0, Math.min(columnCount - 1, columnIndex)),
  };
}
