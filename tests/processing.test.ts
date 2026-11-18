import { describe, expect, it } from "vitest";
import {
  createColumnFilter,
  filterRows,
  getNextSorting,
  sortRows,
} from "../packages/react-data-grid/src/core/processing";
import type { ColumnDef, ColumnFilter } from "../packages/react-data-grid/src";

const rows = Object.freeze([
  Object.freeze({
    name: "item 10",
    salary: 9000,
    team: "Operations",
    date: "2025-02-01",
  }),
  Object.freeze({
    name: "Item 2",
    salary: 100000,
    team: "Design",
    date: new Date("2025-01-01T10:00:00Z"),
  }),
  Object.freeze({
    name: "한글",
    salary: 9000,
    team: "Design",
    date: "2025-01-03T06:00:00+09:00",
  }),
  Object.freeze({
    name: "Alpha",
    salary: null,
    team: "Operations",
    date: "2025-02-31",
  }),
  Object.freeze({
    name: "alpha",
    salary: undefined,
    team: "Design",
    date: undefined,
  }),
  Object.freeze({
    name: "item 3",
    salary: NaN,
    team: "Design",
    date: "2025-01-02",
  }),
  Object.freeze({
    name: "Beta",
    salary: -5.5,
    team: "Design",
    date: "2025-01-01",
  }),
]);
type Row = (typeof rows)[number];
const columns = [
  { key: "name", header: "Name", width: 100 },
  {
    key: "salary",
    header: "Salary",
    width: 100,
    filterType: "number",
    accessor: (row) => row.salary?.toLocaleString("en-US"),
  },
  { key: "team", header: "Team", width: 100 },
  { key: "date", header: "Date", width: 100, filterType: "date" },
  {
    key: "computed",
    header: "Computed",
    width: 100,
    accessor: () => "display only",
    sortAccessor: (row) => -String(row.name).length,
    filterAccessor: (row) => row.name,
  },
  {
    key: "hidden",
    header: "Hidden",
    width: 100,
    accessor: () => "hidden",
    filterAccessor: () => "secret",
    searchable: false,
  },
] satisfies ColumnDef<Row>[];

describe("row sorting", () => {
  it("sorts case-insensitive mixed Korean and English strings naturally with stable ties", () => {
    expect(
      sortRows(
        rows,
        columns,
        [{ columnKey: "name", direction: "asc" }],
        undefined,
      ),
    ).toEqual([3, 4, 6, 1, 5, 0, 2]);
    expect(
      sortRows(
        rows,
        columns,
        [{ columnKey: "name", direction: "desc" }],
        undefined,
      ),
    ).toEqual([2, 0, 5, 1, 6, 3, 4]);
  });

  it("uses raw numeric values, keeps nonfinite and missing values last in either direction, and preserves input", () => {
    expect(
      sortRows(
        rows,
        columns,
        [{ columnKey: "salary", direction: "asc" }],
        undefined,
      ),
    ).toEqual([6, 0, 2, 1, 3, 4, 5]);
    expect(
      sortRows(
        rows,
        columns,
        [{ columnKey: "salary", direction: "desc" }],
        undefined,
      ),
    ).toEqual([1, 0, 2, 6, 3, 4, 5]);
    expect(rows[0].name).toBe("item 10");
    expect(sortRows(rows, columns, [], undefined)).toBeUndefined();
    const filtered = [0, 2];
    expect(sortRows(rows, columns, [], filtered)).toBe(filtered);
  });

  it("orders dates by timestamp, compares offset strings, and puts invalid dates last", () => {
    expect(
      sortRows(
        rows,
        columns,
        [{ columnKey: "date", direction: "asc" }],
        undefined,
      ),
    ).toEqual([6, 1, 5, 2, 0, 3, 4]);
  });

  it("uses ordered criteria and computed sort accessors", () => {
    expect(
      sortRows(
        rows,
        columns,
        [
          { columnKey: "team", direction: "asc" },
          { columnKey: "salary", direction: "desc" },
        ],
        undefined,
      ),
    ).toEqual([1, 2, 6, 4, 5, 0, 3]);
    expect(
      sortRows(
        rows,
        columns,
        [{ columnKey: "computed", direction: "asc" }],
        [0, 2, 6],
      ),
    ).toEqual([0, 6, 2]);
  });

  it("preserves stable collation ties when repeated strings are ranked", () => {
    const repeated = Array.from({ length: 40 }, (_, index) => ({
      name: ["alpha", "Alpha", "beta", undefined][index % 4],
    }));
    const cols = [
      { key: "name", header: "Name", width: 100 },
    ] satisfies ColumnDef<(typeof repeated)[number]>[];
    const expected = Array.from({ length: 10 }, (_, index) => [
      index * 4,
      index * 4 + 1,
    ]).flat();
    const order = sortRows(
      repeated,
      cols,
      [{ columnKey: "name", direction: "asc" }],
      undefined,
    );
    expect(order?.slice(0, 20)).toEqual(expected);
    expect(order?.at(-1)).toBe(39);
  });

  it("cycles single sort and updates multiple criteria in place", () => {
    const a = getNextSorting([], "a", false);
    expect(a).toEqual([{ columnKey: "a", direction: "asc" }]);
    const b = getNextSorting(a, "b", true);
    const desc = getNextSorting(b, "a", true);
    expect(desc).toEqual([
      { columnKey: "a", direction: "desc" },
      { columnKey: "b", direction: "asc" },
    ]);
    expect(getNextSorting(desc, "a", true)).toEqual([
      { columnKey: "b", direction: "asc" },
    ]);
    expect(getNextSorting(getNextSorting(a, "a", false), "a", false)).toEqual(
      [],
    );
    expect(getNextSorting(desc, "b", false)).toHaveLength(1);
    expect(getNextSorting(desc, "c", false)).toEqual([
      { columnKey: "c", direction: "asc" },
    ]);
  });
});

describe("row filtering", () => {
  it.each([
    ["contains", "tEM", [0, 1, 5]],
    ["equals", "ALPHA", [3, 4]],
    ["startsWith", "ITem", [0, 1, 5]],
    ["endsWith", "3", [5]],
  ] as const)("applies the text %s operator", (operator, value, expected) => {
    expect(
      filterRows(
        rows,
        columns,
        [{ columnKey: "name", kind: "text", operator, value }],
        "",
      ),
    ).toEqual(expected);
  });

  it.each([
    ["equals", [0, 2]],
    ["notEquals", [1, 6]],
    ["gt", [1]],
    ["gte", [0, 1, 2]],
    ["lt", [6]],
    ["lte", [0, 2, 6]],
  ] as const)(
    "applies numeric %s and skips nulls in every comparison",
    (operator, expected) => {
      expect(
        filterRows(
          rows,
          columns,
          [{ columnKey: "salary", kind: "number", operator, value: 9000 }],
          "",
        ),
      ).toEqual(expected);
    },
  );

  it.each([
    ["equals", [2, 5]],
    ["before", [1, 6]],
    ["after", [0]],
  ] as const)(
    "compares dates by the calendar day in UTC for %s",
    (operator, expected) => {
      expect(
        filterRows(
          rows,
          columns,
          [{ columnKey: "date", kind: "date", operator, value: "2025-01-02" }],
          "",
        ),
      ).toEqual(expected);
    },
  );

  it("combines filter criteria and search, uses filterAccessor, and preserves source order", () => {
    const team: ColumnFilter = {
      columnKey: "team",
      kind: "text",
      operator: "equals",
      value: "design",
    };
    const salary: ColumnFilter = {
      columnKey: "salary",
      kind: "number",
      operator: "gte",
      value: 9000,
    };
    expect(filterRows(rows, columns, [team, salary], "")).toEqual([1, 2]);
    expect(filterRows(rows, columns, [team, salary], "  한글  ")).toEqual([2]);
    expect(filterRows(rows, columns, [team], "Biology")).toEqual([]);
    expect(filterRows(rows, columns, [team], "  ")).toEqual([1, 2, 4, 5, 6]);
    expect(
      filterRows(
        rows,
        columns,
        [
          {
            columnKey: "computed",
            kind: "text",
            operator: "equals",
            value: "item 2",
          },
        ],
        "",
      ),
    ).toEqual([1]);
    expect(filterRows(rows, columns, [], "oPeRaTions")).toEqual([0, 3]);
    expect(filterRows(rows, columns, [], "display only")).toEqual([]);
    expect(filterRows(rows, columns, [], "secret")).toEqual([]);
    expect(filterRows(rows, columns, [], "  ")).toBeUndefined();
    expect(rows[1].salary).toBe(100000);
  });

  it("validates filter drafts before applying", () => {
    expect(createColumnFilter("salary", "number", "gte", " -20.5 ")).toEqual({
      columnKey: "salary",
      kind: "number",
      operator: "gte",
      value: -20.5,
    });
    expect(
      createColumnFilter("salary", "number", "gte", "0x10"),
    ).toBeUndefined();
    expect(
      createColumnFilter("salary", "number", "gte", "NaN"),
    ).toBeUndefined();
    expect(
      createColumnFilter("date", "date", "equals", "2025-02-29"),
    ).toBeUndefined();
    expect(createColumnFilter("name", "text", "contains", " ")).toBeUndefined();
  });

  it("searches 100,000 rows across searchable columns", () => {
    const many = Array.from({ length: 100_000 }, (_, index) => ({
      name: `Employee ${index}`,
      team: index === 0 ? "needle" : "Design",
    }));
    const searchable = [
      { key: "name", header: "Name", width: 100 },
      { key: "team", header: "Team", width: 100 },
    ] satisfies ColumnDef<(typeof many)[number]>[];
    expect(filterRows(many, searchable, [], " EMPLOYEE 99999 ")).toEqual([
      99_999,
    ]);
    expect(filterRows(many, searchable, [], "needle")).toEqual([0]);
  });
});
