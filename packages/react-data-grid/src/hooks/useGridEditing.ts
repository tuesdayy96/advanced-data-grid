import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  getEditor,
  getEditValue,
  isEditable,
  parseEdit,
  sameValue,
  type EditorKind,
} from "../core/editing";
import type { CellPosition } from "../core/selection";
import type { DataGridProps, RowKey } from "../types/grid";

interface Session {
  cell: CellPosition;
  rowKey: RowKey;
  columnKey: string;
  original: unknown;
  kind: EditorKind;
  initial: string;
}

export function useGridEditing<T extends object>(
  {
    rows,
    columns,
    rowKey,
    onCellChange,
  }: Pick<DataGridProps<T>, "rows" | "columns" | "rowKey" | "onCellChange">,
  enabled: boolean,
  startIndex: number,
  endIndex: number,
  finishNavigation: (cell?: CellPosition, tab?: boolean) => boolean,
) {
  const current = useRef<Session | null>(null);
  const draft = useRef("");
  const [editing, setEditing] = useState<Session | null>(null);
  const [error, setError] = useState<string>();

  function keyFor(row: T): RowKey {
    const key = typeof rowKey === "function" ? rowKey(row) : row[rowKey];
    if (typeof key === "string" || typeof key === "number") return key;
    throw new TypeError("Expected a string or number row key.");
  }

  function getTarget(session: Session) {
    const row = rows[session.cell.rowIndex];
    const column = columns[session.cell.columnIndex];
    if (
      !enabled ||
      !row ||
      !column ||
      column.key !== session.columnKey ||
      !isEditable(column, row) ||
      !Object.is(keyFor(row), session.rowKey) ||
      !sameValue(getEditValue(column, row), session.original)
    )
      return null;
    return { row, column };
  }

  function start(cell: CellPosition) {
    if (!enabled || current.current) return false;
    const row = rows[cell.rowIndex];
    const column = columns[cell.columnIndex];
    const editor = row && column ? getEditor(column, row) : null;
    if (!editor) return false;
    const session = {
      ...editor,
      cell,
      rowKey: keyFor(row),
      columnKey: column.key,
    };
    current.current = session;
    draft.current = editor.initial;
    setError(undefined);
    setEditing(session);
    return true;
  }

  function close() {
    current.current = null;
    setEditing(null);
    setError(undefined);
  }

  function commit(leaving: boolean) {
    const session = current.current;
    if (!session) return false;
    const target = getTarget(session);
    if (!target || draft.current === session.initial) {
      close();
      return true;
    }
    const { row, column } = target;
    const result = parseEdit(
      draft.current,
      session.kind,
      session.original,
      column,
      row,
    );
    if ("error" in result) {
      if (leaving) close();
      setError(result.error);
      return false;
    }

    close();
    if (!sameValue(session.original, result.value)) {
      onCellChange?.({
        rowKey: session.rowKey,
        columnKey: session.columnKey,
        rowIndex: session.cell.rowIndex,
        previousValue: session.original,
        value: result.value,
        row,
      });
    }
    return true;
  }

  const validSession = editing && getTarget(editing) ? editing : null;

  useEffect(() => {
    const session = current.current;
    if (!session) {
      if (!enabled && error) setError(undefined);
      return;
    }
    const { rowIndex } = session.cell;
    if (validSession !== session) {
      close();
      finishNavigation();
    } else if (rowIndex < startIndex || rowIndex >= endIndex) {
      commit(true);
      finishNavigation();
    }
  });

  function onEditorKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    const session = current.current;
    if (!session) return;
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      finishNavigation();
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (commit(false)) finishNavigation();
    } else if (event.key === "Tab") {
      if (!commit(false) || finishNavigation(session.cell, event.shiftKey)) {
        event.preventDefault();
      }
    }
  }

  function updateDraft(value: string) {
    if (!current.current) return;
    draft.current = value;
    if (error) setError(undefined);
  }

  return {
    editing: validSession,
    error,
    start,
    updateDraft,
    onEditorKeyDown,
    onBlur: () => commit(true),
  };
}
