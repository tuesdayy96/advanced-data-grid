import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type RefObject,
} from "react";
import {
  getKeyboardDestination,
  isCellInGrid,
  sameCell,
  type CellPosition,
  type CellSelection,
  type GridSize,
} from "../core/selection";

export function getCellPosition(
  target: EventTarget | null,
  table: HTMLTableElement,
): CellPosition | null {
  if (!(target instanceof Element)) return null;
  const cell = target.closest("td");
  const row = cell?.parentElement?.dataset.adgRow;
  if (!cell || row === undefined || cell.closest("table") !== table)
    return null;
  return { rowIndex: Number(row), columnIndex: cell.cellIndex };
}

export function getCellId(
  gridId: string,
  { rowIndex, columnIndex }: CellPosition,
) {
  return `${gridId}-${rowIndex}-${columnIndex}`;
}

export function useGridSelection(
  enabled: boolean,
  { rowCount, columnCount }: GridSize,
  containerRef: RefObject<HTMLDivElement | null>,
  revealCell: (cell: CellPosition) => void,
) {
  const gridId = useId();
  const tableRef = useRef<HTMLTableElement>(null);
  const [selection, setSelection] = useState<CellSelection | null>(null);
  const size = { rowCount, columnCount };
  const activeSelection =
    enabled &&
    selection &&
    isCellInGrid(selection.active, size) &&
    isCellInGrid(selection.anchor, size)
      ? selection
      : null;

  const drag = useRef<{
    id: number;
    x: number;
    y: number;
    frame: number;
  } | null>(null);

  useEffect(() => {
    if (selection && !activeSelection) setSelection(null);
  }, [selection, activeSelection]);

  useEffect(() => {
    if (!enabled) return;

    function stop(event: globalThis.PointerEvent) {
      if (drag.current?.id !== event.pointerId) return;
      cancelDrag();
    }

    function cancelDrag() {
      if (drag.current) cancelAnimationFrame(drag.current.frame);
      drag.current = null;
    }

    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    window.addEventListener("blur", cancelDrag);
    return () => {
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
      window.removeEventListener("blur", cancelDrag);
      cancelDrag();
    };
  }, [enabled, rowCount, columnCount]);

  function select(cell: CellPosition, extend: boolean) {
    setSelection((previous) => {
      const anchor =
        extend && previous && isCellInGrid(previous.anchor, size)
          ? previous.anchor
          : cell;
      if (
        previous &&
        sameCell(previous.active, cell) &&
        sameCell(previous.anchor, anchor)
      )
        return previous;
      return { active: cell, anchor };
    });
  }

  function onFocus() {
    if (!rowCount || !columnCount || drag.current) return;
    const first = { rowIndex: 0, columnIndex: 0 };
    if (!activeSelection) select(first, false);
    revealCell(activeSelection?.active ?? first);
  }

  function onClick(event: MouseEvent<HTMLTableElement>) {
    // Assistive technology can dispatch a click without a pointer sequence.
    if (event.detail !== 0) return;
    const cell = getCellPosition(event.target, event.currentTarget);
    if (!cell) return;
    event.currentTarget.focus({ preventScroll: true });
    select(cell, event.shiftKey);
    revealCell(cell);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTableElement>) {
    if (
      event.altKey ||
      event.metaKey ||
      (event.ctrlKey && event.key !== "Home" && event.key !== "End")
    )
      return;
    const origin = activeSelection?.active ?? { rowIndex: 0, columnIndex: 0 };
    const destination = getKeyboardDestination(
      origin,
      size,
      event.key,
      event.shiftKey,
      event.ctrlKey,
    );
    if (!destination) return;

    event.preventDefault();
    select(destination, event.shiftKey && event.key.startsWith("Arrow"));
    revealCell(destination);
  }

  function onPointerDown(event: PointerEvent<HTMLTableElement>) {
    if (event.button !== 0 || event.pointerType === "touch") return;
    const cell = getCellPosition(event.target, event.currentTarget);
    if (!cell) return;
    event.preventDefault();
    if (drag.current) cancelAnimationFrame(drag.current.frame);
    drag.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      frame: 0,
    };
    select(cell, event.shiftKey);
    event.currentTarget.focus({ preventScroll: true });
  }

  function scrollAtEdge() {
    const current = drag.current;
    const container = containerRef.current;
    const table = tableRef.current;
    if (!current || !container || !table) return;
    current.frame = 0;

    const rect = container.getBoundingClientRect();
    const left = rect.left + container.clientLeft;
    const right = left + container.clientWidth;
    const top = Math.max(
      rect.top + container.clientTop,
      table.tHead?.rows[0]?.cells[0]?.getBoundingClientRect().bottom ??
        rect.top,
    );
    const bottom = rect.top + container.clientTop + container.clientHeight;
    if (
      current.x < left ||
      current.x >= right ||
      current.y < top ||
      current.y >= bottom
    )
      return;

    const cell = getCellPosition(
      document.elementFromPoint(current.x, current.y),
      table,
    );
    if (cell) select(cell, true);

    const edge = Math.min(24, (bottom - top) / 3);
    const delta =
      current.y < top + edge ? -20 : current.y >= bottom - edge ? 20 : 0;
    const previous = container.scrollTop;
    if (delta) container.scrollTop += delta;
    if (container.scrollTop !== previous)
      current.frame = requestAnimationFrame(scrollAtEdge);
  }

  function onPointerMove(event: PointerEvent<HTMLTableElement>) {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    const cell = getCellPosition(event.target, event.currentTarget);
    if (cell) select(cell, true);
    current.x = event.clientX;
    current.y = event.clientY;
    if (!current.frame) current.frame = requestAnimationFrame(scrollAtEdge);
  }

  function onPointerLeave() {
    if (!drag.current) return;
    cancelAnimationFrame(drag.current.frame);
    drag.current.frame = 0;
  }

  return {
    activeSelection,
    select,
    gridId,
    tableRef,
    onFocus,
    onClick,
    onKeyDown,
    onPointerDown,
    onPointerMove,
    onPointerLeave,
  };
}
