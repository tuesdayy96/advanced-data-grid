import { describe, expect, it } from "vitest";
import {
  getKeyboardDestination,
  getSelectionRange,
  isCellInGrid,
  isCellSelected,
} from "../packages/react-data-grid/src/core/selection";

const size = { rowCount: 4, columnCount: 3 };
const position = (rowIndex: number, columnIndex: number) => ({
  rowIndex,
  columnIndex,
});

describe("selection coordinates", () => {
  it("normalizes an inverted range and includes its edges", () => {
    const range = getSelectionRange({
      anchor: position(3, 2),
      active: position(1, 0),
    });
    expect(range).toEqual({
      startRow: 1,
      endRow: 3,
      startColumn: 0,
      endColumn: 2,
    });
    expect(isCellSelected(position(2, 1), range)).toBe(true);
    expect(isCellSelected(position(3, 2), range)).toBe(true);
    expect(isCellSelected(position(0, 2), range)).toBe(false);
    expect(isCellInGrid(position(-1, 0), size)).toBe(false);
    expect(isCellInGrid(position(4, 0), size)).toBe(false);
    expect(isCellInGrid(position(2, 3), size)).toBe(false);
    expect(isCellInGrid(position(1, 1), size)).toBe(true);
  });

  it.each([
    ["ArrowDown", 0, 0, false, false, position(1, 0)],
    ["ArrowUp", 0, 0, false, false, position(0, 0)],
    ["ArrowLeft", 1, 0, false, false, position(1, 0)],
    ["ArrowRight", 1, 1, false, false, position(1, 2)],
    ["Tab", 1, 2, false, false, position(2, 0)],
    ["Tab", 2, 0, true, false, position(1, 2)],
    ["Tab", 0, 0, true, false, null],
    ["Tab", 3, 2, false, false, null],
    ["Enter", 2, 2, true, false, position(1, 2)],
    ["Enter", 2, 2, false, false, position(3, 2)],
    ["Home", 2, 2, false, false, position(2, 0)],
    ["End", 2, 0, false, false, position(2, 2)],
    ["Home", 2, 2, false, true, position(0, 0)],
    ["End", 1, 0, false, true, position(3, 2)],
    ["F2", 1, 0, false, false, null],
  ] as const)(
    "%s from (%i, %i), shift %s, ctrl %s",
    (key, row, column, shift, ctrl, expected) => {
      expect(
        getKeyboardDestination(position(row, column), size, key, shift, ctrl),
      ).toEqual(expected);
    },
  );

  it("has no destination without rows or columns", () => {
    expect(
      getKeyboardDestination(
        position(0, 0),
        { rowCount: 0, columnCount: 3 },
        "ArrowDown",
        false,
        false,
      ),
    ).toBeNull();
    expect(
      getKeyboardDestination(
        position(0, 0),
        { rowCount: 4, columnCount: 0 },
        "Tab",
        false,
        false,
      ),
    ).toBeNull();
  });
});
