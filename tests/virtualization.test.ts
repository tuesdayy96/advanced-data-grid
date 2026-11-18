import { describe, expect, it } from "vitest";
import { getVirtualRange } from "../packages/react-data-grid/src/core/virtualization";

describe("getVirtualRange", () => {
  it.each([
    {
      label: "empty",
      count: 0,
      offset: 0,
      viewport: 100,
      overscan: 5,
      expected: [0, 0, 0, 0],
    },
    {
      label: "all rows fit",
      count: 2,
      offset: 5,
      viewport: 100,
      overscan: 1,
      expected: [0, 2, 0, 0],
    },
    {
      label: "top",
      count: 100,
      offset: 0,
      viewport: 100,
      overscan: 2,
      expected: [0, 5, 0, 3800],
    },
    {
      label: "middle with partial edges",
      count: 100,
      offset: 815,
      viewport: 110,
      overscan: 2,
      expected: [18, 26, 720, 2960],
    },
    {
      label: "bottom",
      count: 100,
      offset: 3900,
      viewport: 100,
      overscan: 2,
      expected: [95, 100, 3800, 0],
    },
    {
      label: "overscan bigger than dataset",
      count: 3,
      offset: 20,
      viewport: 80,
      overscan: 9,
      expected: [0, 3, 0, 0],
    },
    {
      label: "zero-height viewport",
      count: 100,
      offset: 400,
      viewport: 0,
      overscan: 5,
      expected: [0, 0, 0, 4000],
    },
    {
      label: "negative scroll",
      count: 100,
      offset: -100,
      viewport: 80,
      overscan: 1,
      expected: [0, 3, 0, 3880],
    },
    {
      label: "past the bottom",
      count: 100,
      offset: 9000,
      viewport: 80,
      overscan: 1,
      expected: [97, 100, 3880, 0],
    },
    {
      label: "no overscan at exact boundary",
      count: 100,
      offset: 40,
      viewport: 80,
      overscan: 0,
      expected: [1, 3, 40, 3880],
    },
  ])(
    "returns the expected exclusive range and spacers at $label",
    ({ count, offset, viewport, overscan, expected }) => {
      const range = getVirtualRange(count, 40, offset, viewport, overscan);
      expect([
        range.startIndex,
        range.endIndex,
        range.topPadding,
        range.bottomPadding,
      ]).toEqual(expected);
      expect(range.startIndex).toBeGreaterThanOrEqual(0);
      expect(range.endIndex).toBeGreaterThanOrEqual(range.startIndex);
      expect(range.endIndex).toBeLessThanOrEqual(count);
      expect(range.totalHeight).toBe(count * 40);
      expect(
        range.topPadding +
          (range.endIndex - range.startIndex) * 40 +
          range.bottomPadding,
      ).toBe(range.totalHeight);
    },
  );

  it("responds to viewport and row height changes", () => {
    expect(getVirtualRange(100, 30, 300, 120, 1)).toMatchObject({
      startIndex: 9,
      endIndex: 15,
    });
    expect(getVirtualRange(100, 60, 300, 60, 1)).toMatchObject({
      startIndex: 4,
      endIndex: 7,
    });
  });
});
