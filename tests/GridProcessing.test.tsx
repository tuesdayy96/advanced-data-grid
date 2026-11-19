import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import {
  DataGrid,
  type CellChange,
  type ColumnDef,
} from "../packages/react-data-grid/src";

const rows = [
  {
    id: 10,
    name: "Zoe",
    team: "Design",
    salary: 9000,
    date: new Date("2025-02-01"),
  },
  {
    id: 11,
    name: "Ada",
    team: "Design",
    salary: 100000,
    date: new Date("2025-01-01"),
  },
  {
    id: 12,
    name: "Ben",
    team: "Ops",
    salary: 1500,
    date: new Date("2025-01-02"),
  },
];
type Row = (typeof rows)[number];
const columns = [
  { key: "id", header: "ID", width: 80, sortable: false, filterable: false },
  {
    key: "name",
    header: "Name",
    width: 150,
    editable: true,
    validate: (value) => !!value || "Required.",
  },
  { key: "team", header: "Team", width: 150 },
  {
    key: "salary",
    header: "Salary",
    width: 150,
    filterType: "number",
    accessor: (row) => row.salary.toLocaleString("en-US"),
  },
  { key: "date", header: "Date", width: 150, filterType: "date" },
] satisfies ColumnDef<Row>[];

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function table() {
  return screen.getByRole("grid");
}
function names() {
  return Array.from(
    table().querySelectorAll("tbody tr[data-adg-row]"),
    (row) => row.children[1].textContent,
  );
}
function clickHeader(name: string, shiftKey = false) {
  fireEvent.click(
    screen.getByRole("button", { name: new RegExp(`^Sort by ${name}(,|$)`) }),
    { shiftKey },
  );
}
function selectCell(name: string) {
  const cell = within(table()).getByRole("gridcell", { name });
  fireEvent.pointerDown(cell, {
    button: 0,
    pointerType: "mouse",
    pointerId: 1,
  });
  fireEvent.pointerUp(window, { pointerId: 1 });
}
function active() {
  return document.getElementById(
    table().getAttribute("aria-activedescendant") ?? "",
  )?.textContent;
}
function openFilter(name: string) {
  const trigger = screen.getByRole("button", {
    name: new RegExp(`^Filter ${name}(,|$)`),
  });
  fireEvent.click(trigger);
  return {
    trigger,
    panel: screen.getByRole("region", { name: `Filter ${name}` }),
  };
}
function applyFilter(name: string, operator: string, value: string) {
  const { panel } = openFilter(name);
  fireEvent.change(within(panel).getByLabelText("Condition"), {
    target: { value: operator },
  });
  fireEvent.change(within(panel).getByLabelText("Value"), {
    target: { value },
  });
  fireEvent.click(within(panel).getByRole("button", { name: "Apply" }));
}

function ControlledGrid({
  onChange,
  query = "",
}: {
  onChange: (change: CellChange<Row>) => void;
  query?: string;
}) {
  const [data, setData] = useState(rows);
  return (
    <DataGrid
      columns={columns}
      rows={data}
      rowKey="id"
      enableSelection
      enableEditing
      enableSorting
      enableFiltering
      searchQuery={query}
      onCellChange={(change) => {
        onChange(change);
        setData((previous) =>
          previous.map((row, index) =>
            index === change.rowIndex &&
            row.id === change.rowKey &&
            typeof change.value === "string"
              ? { ...row, name: change.value }
              : row,
          ),
        );
      }}
    />
  );
}

describe("sorting, filtering and searching DataGrid", () => {
  it("cycles sorting, supports priorities, restores source order and emits sort state", () => {
    const onSortChange = vi.fn();
    render(
      <DataGrid
        columns={columns}
        rows={rows}
        rowKey="id"
        enableSelection
        enableSorting
        onSortChange={onSortChange}
      />,
    );
    expect(screen.queryByRole("button", { name: /Sort by ID/ })).toBeNull();
    clickHeader("Name");
    expect(names()).toEqual(["Ada", "Ben", "Zoe"]);
    expect(table().querySelector('[aria-sort="ascending"]')).toBeTruthy();
    clickHeader("Name");
    expect(names()).toEqual(["Zoe", "Ben", "Ada"]);
    clickHeader("Name");
    expect(names()).toEqual(["Zoe", "Ada", "Ben"]);
    expect(onSortChange).toHaveBeenLastCalledWith([]);
    clickHeader("Team");
    clickHeader("Salary", true);
    expect(names()).toEqual(["Zoe", "Ada", "Ben"]);
    clickHeader("Salary", true);
    expect(names()).toEqual(["Ada", "Zoe", "Ben"]);
    expect(onSortChange).toHaveBeenLastCalledWith([
      { columnKey: "team", direction: "asc" },
      { columnKey: "salary", direction: "desc" },
    ]);
  });

  it("keeps the active row identity, collapses a rectangular selection, and clears filtered-out cells", () => {
    render(
      <DataGrid
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        enableSelection
        enableSorting
        enableFiltering
      />,
    );
    selectCell("Zoe");
    fireEvent.keyDown(table(), { key: "ArrowDown", shiftKey: true });
    expect(
      within(table()).getAllByRole("gridcell", { selected: true }),
    ).toHaveLength(2);
    clickHeader("Name");
    expect(active()).toBe("Ada");
    expect(
      within(table()).getAllByRole("gridcell", { selected: true }),
    ).toHaveLength(1);
    applyFilter("Team", "equals", "Design");
    expect(active()).toBe("Ada");
    fireEvent.keyDown(table(), { key: "ArrowDown" });
    expect(active()).toBe("Zoe");
    applyFilter("Name", "equals", "Ada");
    expect(active()).toBeUndefined();
    expect(
      within(table()).queryByRole("gridcell", { selected: true }),
    ).toBeNull();
    fireEvent.keyDown(table(), { key: "End", ctrlKey: true });
    expect(active()).toBe("2025-01-01");
  });

  it("validates filters, combines search and conditions, and restores header focus", () => {
    const onFilterChange = vi.fn();
    const onSortChange = vi.fn();
    const view = (query: string) => (
      <DataGrid
        columns={columns}
        rows={rows}
        rowKey="id"
        enableSelection
        enableSorting
        enableFiltering
        searchQuery={query}
        onSortChange={onSortChange}
        onFilterChange={onFilterChange}
      />
    );
    const { rerender } = render(view(""));
    const { panel, trigger } = openFilter("Salary");
    const input = within(panel).getByLabelText("Value");
    expect(document.activeElement).toBe(input);
    fireEvent.change(input, { target: { value: "not a number" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(within(panel).getByRole("alert")).toBeTruthy();
    expect(onFilterChange).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: "Escape" });
    expect(document.activeElement).toBe(trigger);
    expect(onSortChange).not.toHaveBeenCalled();
    applyFilter("Salary", "gte", "9000");
    applyFilter("Date", "before", "2025-01-03");
    expect(names()).toEqual(["Ada"]);
    expect(onFilterChange).toHaveBeenLastCalledWith([
      { columnKey: "salary", kind: "number", operator: "gte", value: 9000 },
      {
        columnKey: "date",
        kind: "date",
        operator: "before",
        value: "2025-01-03",
      },
    ]);
    rerender(view(" Ben "));
    expect(screen.getByRole("status").textContent).toContain("No rows match");
    fireEvent.click(screen.getByRole("button", { name: "Clear all filters" }));
    expect(names()).toEqual(["Ben"]);
    rerender(view(""));
    expect(names()).toEqual(["Zoe", "Ada", "Ben"]);
  });

  it("edits in a sorted or filtered view using the original index and keeps the active row when it moves", () => {
    const onChange = vi.fn();
    render(<ControlledGrid onChange={onChange} />);
    clickHeader("Name");
    applyFilter("Team", "equals", "Design");
    fireEvent.doubleClick(
      within(table()).getByRole("gridcell", { name: "Ada" }),
    );
    let input = screen.getByRole("textbox", { name: "Edit Name" });
    fireEvent.change(input, { target: { value: "Zulu" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(names()).toEqual(["Zoe", "Zulu"]);
    expect(active()).toBe("Zulu");
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ rowIndex: 1, rowKey: 11, value: "Zulu" }),
    );
    applyFilter("Name", "startsWith", "Z");
    fireEvent.doubleClick(
      within(table()).getByRole("gridcell", { name: "Zulu" }),
    );
    input = screen.getByRole("textbox", { name: "Edit Name" });
    fireEvent.change(input, { target: { value: "Alice" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(names()).toEqual(["Zoe"]);
    expect(active()).toBeUndefined();
  });

  it("commits once before sorting or external search and discards invalid drafts on filter open", () => {
    const onChange = vi.fn();
    const { rerender } = render(<ControlledGrid onChange={onChange} />);
    fireEvent.doubleClick(
      within(table()).getByRole("gridcell", { name: "Zoe" }),
    );
    let input = screen.getByRole("textbox", { name: "Edit Name" });
    fireEvent.change(input, { target: { value: "Aarav" } });
    act(() => screen.getByRole("button", { name: /^Sort by Name/ }).focus());
    clickHeader("Name");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(names()).toEqual(["Aarav", "Ada", "Ben"]);
    fireEvent.doubleClick(
      within(table()).getByRole("gridcell", { name: "Aarav" }),
    );
    input = screen.getByRole("textbox", { name: "Edit Name" });
    fireEvent.change(input, { target: { value: "" } });
    openFilter("Team");
    expect(screen.queryByRole("textbox", { name: "Edit Name" })).toBeNull();
    expect(screen.getByRole("alert").textContent).toBe("Required.");
    expect(onChange).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(screen.getByRole("region", { name: "Filter Team" }), {
      key: "Escape",
    });
    fireEvent.doubleClick(
      within(table()).getByRole("gridcell", { name: "Ada" }),
    );
    input = screen.getByRole("textbox", { name: "Edit Name" });
    fireEvent.change(input, { target: { value: "Adelaide" } });
    rerender(<ControlledGrid onChange={onChange} query="Ben" />);
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ rowIndex: 1, rowKey: 11, value: "Adelaide" }),
    );
    expect(names()).toEqual(["Ben"]);
  });

  it("virtualizes sorted and searched results and clamps an old scroll position", () => {
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(244);
    const big = Array.from({ length: 100_000 }, (_, index) => ({
      ...rows[index % 3],
      id: index,
      name: `Employee ${index}`,
      salary: index,
    }));
    const view = (query: string) => (
      <DataGrid
        columns={columns}
        rows={big}
        rowKey="id"
        height={244}
        enableSelection
        enableSorting
        enableFiltering
        searchQuery={query}
      />
    );
    const { rerender } = render(view(""));
    clickHeader("Salary");
    clickHeader("Salary");
    expect(names()[0]).toBe("Employee 99999");
    const scroller = table().parentElement!;
    fireEvent.scroll(scroller, { target: { scrollTop: 3_999_800 } });
    expect(names().at(-1)).toBe("Employee 0");
    expect(names().length).toBeLessThanOrEqual(16);
    rerender(view("employee 9999"));
    expect(table().getAttribute("aria-rowcount")).toBe("12");
    expect(names().at(-1)).toBe("Employee 9999");
    fireEvent.keyDown(table(), { key: "End", ctrlKey: true });
    expect(active()).toBeTruthy();
    applyFilter("Salary", "lt", "3");
    expect(screen.getByRole("status").textContent).toContain("No rows match");
    rerender(view(""));
    expect(names()).toEqual(["Employee 2", "Employee 1", "Employee 0"]);
    fireEvent.click(screen.getByRole("button", { name: "Clear all filters" }));
    expect(table().getAttribute("aria-rowcount")).toBe("100001");
    expect(names().length).toBeLessThanOrEqual(16);
  });
});

it("indexes the semantic header and rows when a filtered native table declares its row count", () => {
  render(
    <DataGrid columns={columns} rows={rows} rowKey="id" searchQuery="design" />,
  );
  const table = screen.getByRole("table");
  expect(table.getAttribute("aria-rowcount")).toBe("3");
  expect(
    within(table)
      .getAllByRole("row")
      .map((row) => row.getAttribute("aria-rowindex")),
  ).toEqual(["1", "2", "3"]);
});
