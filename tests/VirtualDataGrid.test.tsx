import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DataGrid, type ColumnDef } from "../packages/react-data-grid/src";

interface Row {
  id: number;
}

const rows = Array.from({ length: 100_000 }, (_, id) => ({ id }));
const columns = [
  { key: "id", header: "ID", width: 80 },
] satisfies ColumnDef<Row>[];

let clientHeight: number;
let notifyResize: () => void;
const disconnect = vi.fn();

beforeEach(() => {
  clientHeight = 244;
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockImplementation(
    () => clientHeight,
  );
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: () => void) {
        notifyResize = callback;
      }
      observe() {}
      disconnect = disconnect;
    },
  );
  disconnect.mockClear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function scroller(table: HTMLElement) {
  const element = table.parentElement;
  if (!element) throw new Error("Missing scroller");
  return element;
}

describe("virtual DataGrid", () => {
  it("preserves full rendering without an explicit height", () => {
    render(
      <DataGrid rows={rows.slice(0, 100)} columns={columns} rowKey="id" />,
    );
    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("cell")).toHaveLength(100);
    expect(table.hasAttribute("aria-rowcount")).toBe(false);
  });

  it("renders bounded ranges at the top, middle and bottom with accessible native rows", () => {
    render(<DataGrid rows={rows} columns={columns} rowKey="id" height={244} />);
    const table = screen.getByRole("table");
    const content = within(table);
    expect(content.getByRole("columnheader", { name: "ID" })).toBeTruthy();
    expect(table.querySelector("col")?.style.width).toBe("80px");
    expect(table.getAttribute("aria-rowcount")).toBe("100001");
    expect(table.querySelector("thead tr")?.getAttribute("aria-rowindex")).toBe(
      "1",
    );
    expect(content.getAllByRole("cell")).toHaveLength(10);
    expect(
      content.getByRole("row", { name: "0" }).getAttribute("aria-rowindex"),
    ).toBe("2");

    fireEvent.scroll(scroller(table), { target: { scrollTop: 2_000_000 } });
    expect(content.queryByRole("row", { name: "0" })).toBeNull();
    expect(
      content.getByRole("row", { name: "50000" }).getAttribute("aria-rowindex"),
    ).toBe("50002");
    expect(content.getAllByRole("cell")).toHaveLength(15);
    const spacers = Array.from(
      table.querySelectorAll<HTMLTableCellElement>(
        'tbody tr[aria-hidden="true"] > td',
      ),
    );
    expect(spacers.map((cell) => [cell.colSpan, cell.style.height])).toEqual([
      [1, "1999800px"],
      [1, "1999600px"],
    ]);

    fireEvent.scroll(scroller(table), { target: { scrollTop: 9_000_000 } });
    expect(
      content.getByRole("row", { name: "99999" }).getAttribute("aria-rowindex"),
    ).toBe("100001");
    expect(content.getAllByRole("cell")).toHaveLength(10);
  });

  it("renders only the requested accessors and retains a keyed row in an overlapping range", () => {
    const accessor = vi.fn((row: Row) => `Employee ${row.id}`);
    const computed = [{ key: "name", header: "Name", width: 160, accessor }];
    render(
      <DataGrid
        rows={rows}
        columns={computed}
        rowKey={(row) => row.id}
        height={244}
      />,
    );
    const table = screen.getByRole("table");
    const row = within(table).getByRole("row", { name: "Employee 7" });
    expect(accessor).toHaveBeenCalledTimes(10);

    fireEvent.scroll(scroller(table), { target: { scrollTop: 81 } });
    expect(within(table).getByRole("row", { name: "Employee 7" })).toBe(row);
    expect(
      within(table).getByRole("row", { name: "Employee 12" }),
    ).toBeTruthy();

    accessor.mockClear();
    fireEvent.scroll(scroller(table), { target: { scrollTop: 82 } });
    expect(accessor).not.toHaveBeenCalled();
  });

  it("remeasures the viewport, clamps after shrinking the dataset, and cleans up", () => {
    const { rerender, unmount } = render(
      <DataGrid rows={rows} columns={columns} rowKey="id" height={244} />,
    );
    const table = screen.getByRole("table");
    clientHeight = 444;
    act(() => notifyResize());
    expect(within(table).getAllByRole("cell")).toHaveLength(15);

    fireEvent.scroll(scroller(table), { target: { scrollTop: 3_999_600 } });
    rerender(
      <DataGrid
        rows={rows.slice(0, 3)}
        columns={columns}
        rowKey="id"
        height={244}
      />,
    );
    expect(within(table).getAllByRole("cell")).toHaveLength(3);
    expect(within(table).getByRole("row", { name: "0" })).toBeTruthy();
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it("keeps the empty state for a grid with an explicit height", () => {
    render(
      <DataGrid<Row> rows={[]} columns={columns} rowKey="id" height={244} />,
    );
    expect(screen.getByRole("status").textContent).toBe("No rows to display.");
  });
});
