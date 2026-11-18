import { describe, expect, it } from "vitest";
import { serializeSelection } from "../packages/react-data-grid/src/core/clipboard";
import {
  filterRows,
  sortRows,
} from "../packages/react-data-grid/src/core/processing";
import type { ColumnDef } from "../packages/react-data-grid/src";

const rows = Object.freeze([
  Object.freeze({
    name: "Ada",
    salary: 5000,
    date: new Date("2025-01-02T18:24:00Z"),
    note: null,
  }),
  Object.freeze({
    name: 'Bob\t"quoted"\nline',
    salary: 10000,
    date: new Date("2024-02-29"),
    note: undefined,
  }),
  Object.freeze({
    name: "Cal",
    salary: 2000,
    date: new Date(NaN),
    note: { hidden: true },
  }),
]);
const columns = [
  { key: "name", header: "Name", width: 80 },
  {
    key: "salary",
    header: "Salary",
    width: 80,
    filterType: "number",
    accessor: (row) => row.salary.toLocaleString("en-US"),
  },
  { key: "date", header: "Date", width: 80 },
  { key: "note", header: "Note", width: 80 },
] satisfies ColumnDef<(typeof rows)[number]>[];

function range(
  startRow: number,
  endRow: number,
  startColumn: number,
  endColumn: number,
) {
  return { startRow, endRow, startColumn, endColumn };
}

describe("selection clipboard serialization", () => {
  it("serializes one cell, a row, a column, and a rectangle without headers", () => {
    expect(
      serializeSelection(rows, columns, undefined, range(0, 0, 0, 0)),
    ).toBe("Ada");
    expect(
      serializeSelection(rows, columns, undefined, range(0, 0, 1, 3)),
    ).toBe("5,000\t2025-01-02\t");
    expect(
      serializeSelection(rows, columns, undefined, range(0, 2, 1, 1)),
    ).toBe("5,000\r\n10,000\r\n2,000");
    expect(
      serializeSelection(rows, columns, undefined, range(0, 1, 1, 2)),
    ).toBe("5,000\t2025-01-02\r\n10,000\t2024-02-29");
  });

  it("escapes tabs, newlines, and double quotes and leaves missing or unsupported values blank", () => {
    expect(
      serializeSelection(rows, columns, undefined, range(1, 1, 0, 0)),
    ).toBe('"Bob\t""quoted""\nline"');
    expect(
      serializeSelection(rows, columns, undefined, range(0, 2, 3, 3)),
    ).toBe("\r\n\r\n");
    expect(
      serializeSelection(rows, columns, undefined, range(2, 2, 2, 2)),
    ).toBe("");
  });

  it("uses selected coordinates in sorted, filtered and searched display order without modifying source rows", () => {
    const filtered = filterRows(
      rows,
      columns,
      [{ columnKey: "salary", kind: "number", operator: "gte", value: 5000 }],
      "",
    );
    const sorted = sortRows(
      rows,
      columns,
      [{ columnKey: "salary", direction: "desc" }],
      filtered,
    );
    expect(serializeSelection(rows, columns, sorted, range(0, 1, 1, 2))).toBe(
      "10,000\t2024-02-29\r\n5,000\t2025-01-02",
    );
    expect(
      serializeSelection(
        rows,
        columns,
        filterRows(rows, columns, [], "cal"),
        range(0, 0, 0, 1),
      ),
    ).toBe("Cal\t2,000");
    expect(rows[0].name).toBe("Ada");
  });

  it("serializes 100,000 selected rows independently of a virtual range", () => {
    const many = Array.from({ length: 100_000 }, (_, id) => ({ id }));
    const ids = [{ key: "id", header: "ID", width: 80 }] satisfies ColumnDef<
      (typeof many)[number]
    >[];
    const tsv = serializeSelection(
      many,
      ids,
      undefined,
      range(0, 99_999, 0, 0),
    );
    expect(tsv.startsWith("0\r\n1\r\n2\r\n")).toBe(true);
    expect(tsv.endsWith("\r\n99999")).toBe(true);
    expect(tsv.split("\r\n")).toHaveLength(100_000);
  });
});
