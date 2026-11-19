import { describe, expect, it } from "vitest";
import {
  clampWidth,
  getColumnLayout,
  getWidthLimits,
  revealColumn,
} from "../packages/react-data-grid/src/core/columnLayout";
import type { ColumnDef } from "../packages/react-data-grid/src";

type Row = { a: string; b: string; c: string; d: string; e: string; f: string };
const columns = Object.freeze([
  Object.freeze({ key: "a", header: "A", width: 100 }),
  Object.freeze({ key: "b", header: "B", width: 70, pinned: "right" }),
  Object.freeze({
    key: "c",
    header: "C",
    width: 80,
    pinned: "left",
    minWidth: 65,
    maxWidth: 140,
  }),
  Object.freeze({ key: "d", header: "D", width: 120 }),
  Object.freeze({ key: "e", header: "E", width: 90, pinned: "left" }),
  Object.freeze({ key: "f", header: "F", width: 60, pinned: "right" }),
] satisfies ColumnDef<Row>[]);

describe("column layout", () => {
  it("groups visual pins and accumulates offsets independently from the logical indexes", () => {
    const layout = getColumnLayout(columns, new Map(), true, 440);
    expect(layout.ordered.map(({ column }) => column.key)).toEqual([
      "c",
      "e",
      "a",
      "d",
      "b",
      "f",
    ]);
    expect(layout.byIndex.map(({ offset }) => offset)).toEqual([
      undefined,
      60,
      0,
      undefined,
      80,
      0,
    ]);
    expect(layout.byIndex.map(({ boundary }) => !!boundary)).toEqual([
      false,
      true,
      false,
      false,
      true,
      false,
    ]);
    expect(layout.leftWidth).toBe(170);
    expect(layout.rightWidth).toBe(130);
    expect(layout.width).toBe(520);
    const resized = getColumnLayout(columns, new Map([["c", 120]]), true, 480);
    expect(resized.byIndex[4].offset).toBe(120);
    expect(resized.byIndex[1].offset).toBe(60);
    expect(resized.width).toBe(560);
    expect(columns[2].width).toBe(80);
  });

  it("suspends pins when the viewport would leave an unusable center and restores logical order", () => {
    const narrow = getColumnLayout(columns, new Map(), true, 340);
    expect(narrow.ordered.map(({ column }) => column.key)).toEqual(
      columns.map(({ key }) => key),
    );
    expect(narrow.ordered.every(({ pin }) => pin === undefined)).toBe(true);
    expect(narrow.leftWidth + narrow.rightWidth).toBe(0);
    expect(
      getColumnLayout(columns, new Map(), false).ordered.map(
        ({ index }) => index,
      ),
    ).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("honors resize limits and falls back for invalid initial widths", () => {
    expect(clampWidth(10, getWidthLimits(columns[2]))).toBe(65);
    expect(clampWidth(300, getWidthLimits(columns[2]))).toBe(140);
    expect(clampWidth(10, getWidthLimits(columns[0]))).toBe(60);
    expect(
      getColumnLayout([{ ...columns[0], width: NaN }], new Map(), false).width,
    ).toBe(100);
  });

  it("reveals unpinned cells inside the available center without scrolling for pins", () => {
    const { byIndex, leftWidth, rightWidth } = getColumnLayout(
      columns,
      new Map(),
      true,
      440,
    );
    expect(revealColumn(byIndex[3], 0, 440, leftWidth, rightWidth)).toBe(80);
    expect(revealColumn(byIndex[0], 80, 440, leftWidth, rightWidth)).toBe(0);
    expect(revealColumn(byIndex[1], 80, 440, leftWidth, rightWidth)).toBe(80);
    expect(revealColumn(byIndex[2], 80, 440, leftWidth, rightWidth)).toBe(80);
  });
});
