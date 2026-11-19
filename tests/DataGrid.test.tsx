import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DataGrid, type ColumnDef } from "../packages/react-data-grid/src";

afterEach(cleanup);

interface Employee {
  id: number;
  name: string;
  note?: string | null;
  joined: Date;
  details: { office: string };
}

const rows: Employee[] = [
  {
    id: 10,
    name: "Alice",
    note: null,
    joined: new Date("2025-01-15"),
    details: { office: "Seoul" },
  },
  {
    id: 11,
    name: "Bob",
    joined: new Date("2025-02-16"),
    details: { office: "Busan" },
  },
];

const columns = [
  { key: "id", header: "ID", width: 80 },
  { key: "name", header: "Name", width: 200 },
] satisfies readonly ColumnDef<Employee>[];

describe("DataGrid", () => {
  it("renders column headers and row values in an accessible table", () => {
    render(
      <DataGrid
        columns={columns}
        rows={rows}
        rowKey="id"
        aria-label="Employees"
      />,
    );
    const table = within(screen.getByRole("table", { name: "Employees" }));
    expect(
      table.getAllByRole("columnheader").map((cell) => cell.textContent),
    ).toEqual(["ID", "Name"]);
    expect(table.getAllByRole("cell").map((cell) => cell.textContent)).toEqual([
      "10",
      "Alice",
      "11",
      "Bob",
    ]);
  });

  it("uses accessor results for computed columns and existing fields", () => {
    const computed = [
      {
        key: "office",
        header: "Office",
        width: 140,
        accessor: (row) => row.details.office,
      },
      { key: "name", header: "Name", width: 200, accessor: () => undefined },
    ] satisfies readonly ColumnDef<Employee>[];
    render(<DataGrid columns={computed} rows={[rows[0]]} rowKey="id" />);
    expect(screen.getAllByRole("cell").map((cell) => cell.textContent)).toEqual(
      ["Seoul", "—"],
    );
  });

  it("shows the empty state and preserves column headings", () => {
    render(<DataGrid<Employee> columns={columns} rows={[]} rowKey="id" />);
    expect(screen.getByRole("status").textContent).toBe("No rows to display.");
    expect(screen.getAllByRole("columnheader")).toHaveLength(2);
    expect(screen.queryAllByRole("cell")).toHaveLength(0);
  });

  it("formats dates and shows a placeholder for missing and complex values", () => {
    const additional = [
      { key: "note", header: "Note", width: 100 },
      { key: "joined", header: "Joined", width: 140 },
      { key: "details", header: "Details", width: 180 },
    ] satisfies readonly ColumnDef<Employee>[];
    render(<DataGrid columns={additional} rows={rows} rowKey="id" />);
    expect(screen.getAllByRole("cell").map((cell) => cell.textContent)).toEqual(
      ["—", "2025-01-15", "—", "—", "2025-02-16", "—"],
    );
  });

  it("assigns the configured widths to the shared table columns", () => {
    render(<DataGrid columns={columns} rows={rows} rowKey="id" />);
    const table = screen.getByRole("table");
    expect(table.style.width).toBe("280px");
    expect(
      Array.from(table.querySelectorAll("col"), (col) => col.style.width),
    ).toEqual(["80px", "200px"]);
  });

  it.each(["field", "function"] as const)(
    "preserves rows after reordering with a %s row key",
    (mode) => {
      const rowKey = mode === "field" ? "id" : (row: Employee) => row.id;
      const { rerender } = render(
        <DataGrid columns={columns} rows={rows} rowKey={rowKey} />,
      );
      const alice = screen.getByRole("row", { name: "10 Alice" });
      const bob = screen.getByRole("row", { name: "11 Bob" });

      rerender(
        <DataGrid
          columns={columns}
          rows={[{ ...rows[1] }, { ...rows[0] }]}
          rowKey={rowKey}
        />,
      );
      expect(screen.getAllByRole("row").slice(1)).toEqual([bob, alice]);
      expect(screen.getByRole("row", { name: "10 Alice" })).toBe(alice);
      expect(screen.getByRole("row", { name: "11 Bob" })).toBe(bob);
    },
  );
});
