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

const rows = [
  { id: 1, name: "Zoe", team: "Design", salary: 5000 },
  { id: 2, name: "Ada", team: "Design", salary: 20000 },
  { id: 3, name: "Ben", team: "Ops", salary: 10000 },
];
type Row = (typeof rows)[number];
const columns = Object.freeze([
  Object.freeze({
    key: "id",
    header: "ID",
    width: 80,
    resizable: false,
    pinned: "left",
  }),
  Object.freeze({
    key: "name",
    header: "Name",
    width: 140,
    minWidth: 100,
    maxWidth: 200,
    editable: true,
    pinned: "left",
  }),
  Object.freeze({ key: "team", header: "Team", width: 150, pinned: "right" }),
  Object.freeze({
    key: "salary",
    header: "Salary",
    width: 150,
    filterType: "number",
    accessor: (row: Row) => row.salary.toLocaleString("en-US"),
  }),
] satisfies readonly ColumnDef<Row>[]);

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const grid = () => screen.getByRole("grid");
const cell = (name: string) => within(grid()).getByRole("gridcell", { name });
function select(name: string, shiftKey = false) {
  fireEvent.pointerDown(cell(name), {
    button: 0,
    pointerType: "mouse",
    pointerId: 1,
    shiftKey,
  });
  fireEvent.pointerUp(window, { pointerId: 1 });
}
function copy(target: HTMLElement = grid()) {
  const setData = vi.fn();
  fireEvent.copy(target, { clipboardData: { setData } });
  return setData;
}
function header(name: string) {
  return Array.from(grid().querySelectorAll("th")).find(
    (element) => element.title === name,
  );
}

describe("grid clipboard interactions", () => {
  it("copies the logical rectangle in sorted, filtered, searched order including a pinned column", () => {
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(450);
    render(
      <DataGrid
        columns={columns}
        rows={rows}
        rowKey="id"
        enableSelection
        enableClipboard
        enableSorting
        enableFiltering
        searchQuery="design"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /^Sort by Salary/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Sort by Salary/ }));
    fireEvent.click(screen.getByRole("button", { name: "Filter Salary" }));
    const panel = screen.getByRole("region", { name: "Filter Salary" });
    fireEvent.change(within(panel).getByLabelText("Condition"), {
      target: { value: "gte" },
    });
    fireEvent.change(within(panel).getByLabelText("Value"), {
      target: { value: "5000" },
    });
    fireEvent.click(within(panel).getByRole("button", { name: "Apply" }));
    expect(header("Team")?.getAttribute("data-pin")).toBe("right");
    expect(
      Array.from(grid().querySelectorAll("th"), (element) => element.title),
    ).toEqual(["ID", "Name", "Salary", "Team"]);
    select("Ada");
    select("5,000", true);
    expect(copy()).toHaveBeenCalledExactlyOnceWith(
      "text/plain",
      "Ada\tDesign\t20,000\r\nZoe\tDesign\t5,000",
    );
  });

  it("leaves editor, filter, and external input copy events to the browser", () => {
    render(
      <>
        <DataGrid
          columns={columns}
          rows={rows}
          rowKey="id"
          enableSelection
          enableEditing
          enableFiltering
          enableClipboard
        />
        <input aria-label="Outside" />
      </>,
    );
    expect(copy()).not.toHaveBeenCalled();
    select("Zoe");
    expect(copy()).toHaveBeenCalledExactlyOnceWith("text/plain", "Zoe");
    fireEvent.keyDown(grid(), { key: "F2" });
    expect(
      copy(screen.getByRole("textbox", { name: "Edit Name" })),
    ).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Edit Name" }), {
      key: "Escape",
    });
    fireEvent.click(screen.getByRole("button", { name: "Filter Name" }));
    expect(copy(screen.getByLabelText("Value"))).not.toHaveBeenCalled();
    expect(copy(screen.getByLabelText("Outside"))).not.toHaveBeenCalled();
  });

  it("requires both clipboard and selection and reports clipboard write failure", async () => {
    const { rerender } = render(
      <DataGrid columns={columns} rows={rows} rowKey="id" enableClipboard />,
    );
    expect(copy(screen.getByRole("table"))).not.toHaveBeenCalled();
    rerender(
      <DataGrid columns={columns} rows={rows} rowKey="id" enableSelection />,
    );
    select("Zoe");
    expect(copy()).not.toHaveBeenCalled();
    rerender(
      <DataGrid
        columns={columns}
        rows={rows}
        rowKey="id"
        enableSelection
        enableClipboard
      />,
    );
    const previous = Object.getOwnPropertyDescriptor(
      window.navigator,
      "clipboard",
    );
    const writeText = vi.fn().mockRejectedValue(new Error("Permission denied"));
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    try {
      fireEvent.copy(grid(), {
        clipboardData: {
          setData: () => {
            throw new Error("Read-only data");
          },
        },
      });
      expect((await screen.findByRole("alert")).textContent).toBe(
        "Could not copy the selected cells.",
      );
      expect(writeText).toHaveBeenCalledExactlyOnceWith("Zoe");
      expect(copy()).toHaveBeenCalledExactlyOnceWith("text/plain", "Zoe");
      expect(screen.queryByRole("alert")).toBeNull();
    } finally {
      if (previous)
        Object.defineProperty(window.navigator, "clipboard", previous);
      else Reflect.deleteProperty(window.navigator, "clipboard");
    }
  });

  it("copies a 100,000-row selection while only mounting the visible rows", () => {
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(244);
    const data = Array.from({ length: 100_000 }, (_, id) => ({ id }));
    const cols = [{ key: "id", header: "ID", width: 80 }] satisfies ColumnDef<
      (typeof data)[number]
    >[];
    render(
      <DataGrid
        columns={cols}
        rows={data}
        rowKey="id"
        enableSelection
        enableClipboard
        height={244}
      />,
    );
    select("0");
    fireEvent.scroll(grid().parentElement!, {
      target: { scrollTop: 3_999_800 },
    });
    select("99999", true);
    expect(within(grid()).getAllByRole("gridcell").length).toBeLessThan(20);
    const setData = copy();
    const value: string = setData.mock.calls[0][1];
    expect(value.split("\r\n")).toHaveLength(100_000);
    expect(value.endsWith("\r\n99999")).toBe(true);
  });
});

describe("column resize and pinning interactions", () => {
  function widths() {
    return Array.from(grid().querySelectorAll("col"), (col) => col.style.width);
  }
  function drag(handle: HTMLElement, to: number) {
    fireEvent.pointerDown(handle, { button: 0, pointerId: 4, clientX: 100 });
    fireEvent.pointerMove(window, { pointerId: 4, clientX: to });
  }

  it("previews, clamps, commits once on release outside, and cancels without sorting or refiltering", async () => {
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(600);
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(244);
    const getName = vi.fn((row: Row) => row.name);
    const defs = columns.map((column) =>
      column.key === "name" ? { ...column, sortAccessor: getName } : column,
    );
    const onColumnResize = vi.fn();
    const onSortChange = vi.fn();
    render(
      <DataGrid
        columns={defs}
        rows={rows}
        rowKey="id"
        height={244}
        enableSelection
        enableColumnResize
        enableSorting
        enableFiltering
        onColumnResize={onColumnResize}
        onSortChange={onSortChange}
      />,
    );
    expect(screen.queryByRole("button", { name: "Resize ID" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /^Sort by Name/ }));
    getName.mockClear();
    onSortChange.mockClear();
    const handle = screen.getByRole("button", { name: "Resize Name" });
    drag(handle, 400);
    await act(async () => {
      await new Promise(requestAnimationFrame);
    });
    expect(widths()[1]).toBe("200px");
    expect(onColumnResize).not.toHaveBeenCalled();
    fireEvent.pointerUp(document.body, { pointerId: 4 });
    fireEvent.click(handle);
    expect(onColumnResize).toHaveBeenCalledExactlyOnceWith("name", 200);
    expect(getName).not.toHaveBeenCalled();
    expect(onSortChange).not.toHaveBeenCalled();
    expect(columns[1].width).toBe(140);

    drag(handle, 0);
    await act(async () => {
      await new Promise(requestAnimationFrame);
    });
    expect(widths()[1]).toBe("100px");
    fireEvent.pointerCancel(window, { pointerId: 4 });
    expect(widths()[1]).toBe("200px");
    expect(onColumnResize).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Filter Name" }));
    expect(screen.getByRole("region", { name: "Filter Name" })).toBeTruthy();
  });

  it("applies pins to the header and body, keeps edited coordinates and suspends pins in narrow viewports", () => {
    let viewport = 550;
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(
      () => viewport,
    );
    const onCellChange = vi.fn();
    const { rerender } = render(
      <DataGrid
        columns={columns}
        rows={rows}
        rowKey="id"
        enableSelection
        enableEditing
        enableColumnResize
        onCellChange={onCellChange}
      />,
    );
    expect(header("Name")?.style.left).toBe("80px");
    expect(cell("Zoe").style.left).toBe("80px");
    expect(header("Team")?.style.right).toBe("0px");
    select("Zoe");
    fireEvent.keyDown(grid(), { key: "F2" });
    const input = screen.getByRole("textbox", { name: "Edit Name" });
    fireEvent.change(input, { target: { value: "Zoey" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onCellChange).toHaveBeenCalledWith(
      expect.objectContaining({ rowKey: 1, columnKey: "name", value: "Zoey" }),
    );

    viewport = 400;
    fireEvent.resize(window);
    expect(header("Team")?.hasAttribute("data-pin")).toBe(false);
    viewport = 550;
    fireEvent.resize(window);
    expect(header("Team")?.hasAttribute("data-pin")).toBe(true);
    rerender(
      <DataGrid
        columns={columns}
        rows={rows}
        rowKey="id"
        enableSelection
        enableColumnPinning={false}
      />,
    );
    expect(header("Team")?.hasAttribute("data-pin")).toBe(false);
  });
});
