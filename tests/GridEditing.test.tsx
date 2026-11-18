import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DataGrid, type ColumnDef } from "../packages/react-data-grid/src";

interface Row {
  id: number;
  name: string;
  salary: number;
  date: Date;
}
const rows = [
  Object.freeze({
    id: 10,
    name: "Alice",
    salary: 1000,
    date: new Date("2025-01-01"),
  }),
  Object.freeze({
    id: 11,
    name: "Bob",
    salary: 2000,
    date: new Date("2025-01-02"),
  }),
];
const columns = [
  { key: "id", header: "ID", width: 80 },
  {
    key: "name",
    header: "Name",
    width: 140,
    editable: (row) => row.id === 10,
    validate: (value) => !!value || "Name is required.",
  },
  {
    key: "salary",
    header: "Salary",
    width: 140,
    editable: true,
    editor: "number",
    accessor: (row) => row.salary.toLocaleString("en-US"),
  },
  { key: "date", header: "Date", width: 140, editable: true },
] satisfies ColumnDef<Row>[];

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const grid = () => screen.getByRole("grid");
const cell = (name: string) => within(grid()).getByRole("gridcell", { name });
const active = () =>
  document.getElementById(grid().getAttribute("aria-activedescendant") ?? "")
    ?.textContent;
const click = (name: string) => {
  fireEvent.pointerDown(cell(name), {
    button: 0,
    pointerType: "mouse",
    pointerId: 1,
  });
  fireEvent.pointerUp(window, { pointerId: 1 });
};
const key = (target: HTMLElement, key: string, modifiers = {}) =>
  fireEvent.keyDown(target, { key, ...modifiers });
const draft = (input: HTMLElement, value: string) =>
  fireEvent.change(input, { target: { value } });

describe("DataGrid editing", () => {
  it("starts on double-click, sends a single controlled event with raw values, and restores focus", () => {
    const onCellChange = vi.fn();
    render(
      <DataGrid
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        enableSelection
        enableEditing
        onCellChange={onCellChange}
      />,
    );
    fireEvent.doubleClick(cell("1,000"));
    const input = screen.getByRole<HTMLInputElement>("textbox", {
      name: "Edit Salary",
    });
    expect(input.value).toBe("1000");
    expect(document.activeElement).toBe(input);
    draft(input, "1500.5");
    key(input, "Enter");
    expect(onCellChange).toHaveBeenCalledExactlyOnceWith({
      rowKey: 10,
      rowIndex: 0,
      columnKey: "salary",
      previousValue: 1000,
      value: 1500.5,
      row: rows[0],
    });
    expect(active()).toBe("1,000");
    expect(document.activeElement).toBe(grid());
    expect(rows[0].salary).toBe(1000);
  });

  it("preserves navigation for read-only cells and starts editing from Enter or F2", () => {
    render(
      <DataGrid
        columns={columns}
        rows={rows}
        rowKey="id"
        enableSelection
        enableEditing
      />,
    );
    click("10");
    key(grid(), "Enter");
    expect(active()).toBe("11");
    click("Bob");
    key(grid(), "F2");
    expect(screen.queryByRole("textbox")).toBeNull();
    click("Alice");
    key(grid(), "Enter");
    const input = screen.getByRole("textbox", { name: "Edit Name" });
    key(input, "Escape");
    key(grid(), "F2");
    expect(screen.getByRole("textbox", { name: "Edit Name" })).toBeTruthy();
  });

  it("keeps invalid Tab edits open, ignores composing Enter, and commits once on valid Tab", () => {
    const onCellChange = vi.fn();
    render(
      <DataGrid
        columns={columns}
        rows={rows}
        rowKey="id"
        enableSelection
        enableEditing
        onCellChange={onCellChange}
      />,
    );
    click("Alice");
    key(grid(), "F2");
    const input = screen.getByRole("textbox", { name: "Edit Name" });
    draft(input, "");
    key(input, "Tab");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("alert").textContent).toBe("Name is required.");
    expect(onCellChange).not.toHaveBeenCalled();
    draft(input, "Alicia");
    key(input, "Enter", { isComposing: true });
    key(input, "ArrowRight");
    expect(document.activeElement).toBe(input);
    expect(onCellChange).not.toHaveBeenCalled();
    key(input, "Tab", { shiftKey: true });
    expect(active()).toBe("10");
    expect(onCellChange).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("never emits for Escape or unchanged numeric/date values", () => {
    const onCellChange = vi.fn();
    render(
      <DataGrid
        columns={columns}
        rows={rows}
        rowKey="id"
        enableSelection
        enableEditing
        onCellChange={onCellChange}
      />,
    );
    click("Alice");
    key(grid(), "Enter");
    const name = screen.getByRole("textbox", { name: "Edit Name" });
    draft(name, "Ignored");
    key(name, "Escape");
    expect(active()).toBe("Alice");
    fireEvent.doubleClick(cell("1,000"));
    const number = screen.getByRole("textbox", { name: "Edit Salary" });
    draft(number, "1000.0");
    key(number, "Enter");
    fireEvent.doubleClick(cell("2025-01-01"));
    const date = screen.getByLabelText<HTMLInputElement>("Edit Date");
    expect(date.type).toBe("date");
    key(date, "Enter");
    expect(onCellChange).not.toHaveBeenCalled();
  });

  it("commits on blur and reports invalid discarded drafts without stealing external focus", () => {
    const onCellChange = vi.fn();
    render(
      <>
        <DataGrid
          columns={columns}
          rows={rows}
          rowKey="id"
          enableSelection
          enableEditing
          onCellChange={onCellChange}
        />
        <button>Outside</button>
      </>,
    );
    const outside = screen.getByRole("button", { name: "Outside" });
    fireEvent.doubleClick(cell("Alice"));
    draft(screen.getByRole("textbox"), "Changed");
    act(() => outside.focus());
    expect(onCellChange).toHaveBeenCalledTimes(1);
    fireEvent.doubleClick(cell("Alice"));
    draft(screen.getByRole("textbox"), "");
    act(() => outside.focus());
    expect(onCellChange).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByRole("alert").textContent).toBe("Name is required.");
    expect(document.activeElement).toBe(outside);
  });

  it("commits when a virtual row unmounts and cancels if the target data is replaced", () => {
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(244);
    const large = [
      ...rows,
      ...Array.from({ length: 99_998 }, (_, index) => ({
        ...rows[1],
        id: index + 100,
      })),
    ];
    const onCellChange = vi.fn();
    const view = (data: readonly Row[]) => (
      <DataGrid
        columns={columns}
        rows={data}
        rowKey="id"
        enableSelection
        enableEditing
        height={244}
        onCellChange={onCellChange}
      />
    );
    const { rerender } = render(view(large));
    fireEvent.doubleClick(cell("Alice"));
    draft(screen.getByRole("textbox"), "First");
    fireEvent.scroll(grid().parentElement!, {
      target: { scrollTop: 3_999_800 },
    });
    expect(onCellChange).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(document.activeElement).toBe(grid());
    fireEvent.scroll(grid().parentElement!, { target: { scrollTop: 0 } });
    fireEvent.doubleClick(cell("Alice"));
    draft(screen.getByRole("textbox"), "");
    fireEvent.scroll(grid().parentElement!, {
      target: { scrollTop: 3_999_800 },
    });
    expect(onCellChange).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("alert").textContent).toBe("Name is required.");
    fireEvent.scroll(grid().parentElement!, { target: { scrollTop: 0 } });
    fireEvent.doubleClick(cell("Alice"));
    draft(screen.getByRole("textbox"), "Discard");
    rerender(view(large.slice(1)));
    expect(onCellChange).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("requires both selection and editing flags", () => {
    const { rerender } = render(
      <DataGrid columns={columns} rows={rows} rowKey="id" enableEditing />,
    );
    fireEvent.doubleClick(screen.getByRole("cell", { name: "Alice" }));
    expect(screen.queryByRole("textbox")).toBeNull();
    rerender(
      <DataGrid columns={columns} rows={rows} rowKey="id" enableSelection />,
    );
    fireEvent.doubleClick(cell("Alice"));
    expect(screen.queryByRole("textbox")).toBeNull();
  });
});
