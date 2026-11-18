import type { ColumnDef, ColumnPin } from "../types/grid";

export interface LayoutColumn<T> {
  column: ColumnDef<T>;
  index: number;
  visualIndex: number;
  width: number;
  left: number;
  pin?: ColumnPin;
  offset?: number;
  boundary?: boolean;
}

export function getWidthLimits<T>(column: ColumnDef<T>) {
  const maximum = column.maxWidth;
  const minimum = column.minWidth;
  const max =
    maximum !== undefined && Number.isFinite(maximum) && maximum > 0
      ? maximum
      : undefined;
  const min =
    minimum !== undefined && Number.isFinite(minimum) && minimum > 0
      ? minimum
      : 60;
  return { min: max === undefined ? min : Math.min(max, min), max };
}

export function clampWidth(
  width: number,
  { min, max }: ReturnType<typeof getWidthLimits>,
) {
  return Math.min(max ?? Infinity, Math.max(min, width));
}

export function getColumnLayout<T>(
  columns: readonly ColumnDef<T>[],
  widths: ReadonlyMap<string, number>,
  pinning: boolean,
  viewport?: number,
) {
  const entries = columns.map<LayoutColumn<T>>((column, index) => {
    const override = widths.get(column.key);
    const initial =
      Number.isFinite(column.width) && column.width > 0 ? column.width : 100;
    const width =
      override !== undefined ||
      column.minWidth !== undefined ||
      column.maxWidth !== undefined
        ? clampWidth(override ?? initial, getWidthLimits(column))
        : initial;
    return {
      column,
      index,
      width,
      left: 0,
      visualIndex: index,
      pin: pinning ? column.pinned : undefined,
    };
  });

  const left = entries.filter(({ pin }) => pin === "left");
  const right = entries.filter(({ pin }) => pin === "right");
  const center = entries.filter(({ pin }) => !pin);
  const leftWidth = left.reduce((sum, entry) => sum + entry.width, 0);
  const rightWidth = right.reduce((sum, entry) => sum + entry.width, 0);
  const pinnedWidth = leftWidth + rightWidth;
  const fits =
    viewport === undefined ||
    pinnedWidth + (center.length ? 48 : 0) <= viewport;
  if (!fits) for (const entry of entries) entry.pin = undefined;

  const ordered =
    fits && pinnedWidth ? [...left, ...center, ...right] : entries;
  let width = 0;
  for (const [visualIndex, entry] of ordered.entries()) {
    entry.visualIndex = visualIndex;
    entry.left = width;
    width += entry.width;
  }
  if (fits) {
    for (const entry of left) entry.offset = entry.left;
    for (const entry of right) entry.offset = width - entry.left - entry.width;
    if (left.length) left[left.length - 1].boundary = true;
    if (right.length) right[0].boundary = true;
  }
  return {
    ordered,
    byIndex: entries,
    width,
    leftWidth: fits ? leftWidth : 0,
    rightWidth: fits ? rightWidth : 0,
  };
}

export function revealColumn<T>(
  entry: LayoutColumn<T>,
  scrollLeft: number,
  viewport: number,
  leftWidth: number,
  rightWidth: number,
) {
  if (entry.pin || viewport <= 0) return scrollLeft;
  const available = viewport - leftWidth - rightWidth;
  if (entry.left < scrollLeft + leftWidth || entry.width > available)
    return Math.max(0, entry.left - leftWidth);
  const right = entry.left + entry.width;
  if (right > scrollLeft + viewport - rightWidth)
    return right + rightWidth - viewport;
  return scrollLeft;
}
