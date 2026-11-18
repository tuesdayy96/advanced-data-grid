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

const rows = Array.from({ length: 100_000 }, (_, id) => ({
  id,
  name: `Employee ${id}`,
}));
const columns = [
  { key: "id", header: "ID", width: 80 },
  { key: "name", header: "Name", width: 140 },
] satisfies ColumnDef<(typeof rows)[number]>[];

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function cell(name: string) {
  return within(screen.getByRole("grid")).getByRole("gridcell", { name });
}

function active() {
  const id = screen.getByRole("grid").getAttribute("aria-activedescendant");
  return id ? document.getElementById(id)?.textContent : undefined;
}

function selected() {
  return within(screen.getByRole("grid"))
    .getAllByRole("gridcell", { selected: true })
    .map((element) => element.textContent);
}

function press(name: string, shiftKey = false) {
  fireEvent.pointerDown(cell(name), {
    button: 0,
    pointerId: 1,
    pointerType: "mouse",
    shiftKey,
  });
  fireEvent.pointerUp(window, { pointerId: 1 });
}

describe("interactive DataGrid", () => {
  it("selects a cell, focuses the grid, and anchors Shift+click", () => {
    render(
      <DataGrid
        columns={columns}
        rows={rows.slice(0, 4)}
        rowKey="id"
        enableSelection
      />,
    );
    press("Employee 2");
    expect(document.activeElement).toBe(screen.getByRole("grid"));
    expect(active()).toBe("Employee 2");
    expect(selected()).toEqual(["Employee 2"]);
    press("0", true);
    expect(active()).toBe("0");
    expect(selected()).toEqual([
      "0",
      "Employee 0",
      "1",
      "Employee 1",
      "2",
      "Employee 2",
    ]);
    press("Employee 3");
    expect(selected()).toEqual(["Employee 3"]);
  });

  it("supports dragging and ends on release outside or cancellation", () => {
    render(
      <DataGrid
        columns={columns}
        rows={rows.slice(0, 4)}
        rowKey="id"
        enableSelection
      />,
    );
    fireEvent.pointerDown(cell("1"), {
      button: 0,
      pointerId: 1,
      pointerType: "mouse",
    });
    fireEvent.pointerMove(cell("Employee 2"), { pointerId: 1 });
    expect(selected()).toEqual(["1", "Employee 1", "2", "Employee 2"]);
    fireEvent.pointerUp(window, { pointerId: 1 });
    fireEvent.pointerMove(cell("Employee 3"), { pointerId: 1 });
    expect(active()).toBe("Employee 2");

    fireEvent.pointerDown(cell("0"), {
      button: 0,
      pointerId: 2,
      pointerType: "mouse",
    });
    fireEvent.pointerCancel(window, { pointerId: 2 });
    fireEvent.pointerMove(cell("Employee 3"), { pointerId: 2 });
    expect(selected()).toEqual(["0"]);
    fireEvent.pointerDown(cell("1"), {
      button: 0,
      pointerId: 3,
      pointerType: "touch",
    });
    expect(selected()).toEqual(["0"]);
  });

  it("navigates, shrinks a Shift rectangle, and leaves Tab unhandled at both boundaries", () => {
    render(
      <DataGrid
        columns={columns}
        rows={rows.slice(0, 3)}
        rowKey="id"
        enableSelection
      />,
    );
    const grid = screen.getByRole("grid");
    act(() => grid.focus());
    expect(active()).toBe("0");
    expect(fireEvent.keyDown(grid, { key: "Tab", shiftKey: true })).toBe(true);
    fireEvent.keyDown(grid, { key: "ArrowRight", shiftKey: true });
    fireEvent.keyDown(grid, { key: "ArrowDown", shiftKey: true });
    expect(selected()).toEqual(["0", "Employee 0", "1", "Employee 1"]);
    fireEvent.keyDown(grid, { key: "ArrowLeft", shiftKey: true });
    expect(selected()).toEqual(["0", "1"]);
    fireEvent.keyDown(grid, { key: "End" });
    expect(active()).toBe("Employee 1");
    expect(selected()).toEqual(["Employee 1"]);
    fireEvent.keyDown(grid, { key: "Tab" });
    expect(active()).toBe("2");
    fireEvent.keyDown(grid, { key: "Enter", shiftKey: true });
    expect(active()).toBe("1");
    fireEvent.keyDown(grid, { key: "End", ctrlKey: true });
    expect(active()).toBe("Employee 2");
    expect(fireEvent.keyDown(grid, { key: "Tab" })).toBe(true);
  });

  it("reveals offscreen cells and restores selection when virtual rows remount", () => {
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(244);
    const { rerender } = render(
      <DataGrid
        columns={columns}
        rows={rows}
        rowKey="id"
        height={244}
        enableSelection
      />,
    );
    const grid = screen.getByRole("grid");
    const scroller = grid.parentElement!;
    press("0");
    fireEvent.keyDown(grid, { key: "End", ctrlKey: true });
    expect(scroller.scrollTop).toBe(3_999_800);
    expect(grid.hasAttribute("aria-activedescendant")).toBe(false);
    fireEvent.scroll(scroller);
    expect(active()).toBe("Employee 99999");

    fireEvent.scroll(scroller, { target: { scrollTop: 0 } });
    expect(grid.hasAttribute("aria-activedescendant")).toBe(false);
    fireEvent.scroll(scroller, { target: { scrollTop: 3_999_800 } });
    expect(active()).toBe("Employee 99999");
    expect(selected()).toEqual(["Employee 99999"]);

    rerender(
      <DataGrid
        columns={columns}
        rows={rows.slice(0, 3)}
        rowKey="id"
        height={244}
        enableSelection
      />,
    );
    expect(grid.hasAttribute("aria-activedescendant")).toBe(false);
    expect(grid.querySelector('[aria-selected="true"]')).toBeNull();
  });

  it("reveals a row when there is only enough viewport height for part of it", () => {
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(64);
    render(
      <DataGrid
        columns={columns}
        rows={rows.slice(0, 20)}
        rowKey="id"
        height={64}
        enableSelection
      />,
    );
    press("0");
    const grid = screen.getByRole("grid");
    fireEvent.keyDown(grid, { key: "ArrowDown" });
    expect(grid.parentElement?.scrollTop).toBe(40);
  });

  it("leaves the empty state intact", () => {
    render(
      <DataGrid<(typeof rows)[number]>
        columns={columns}
        rows={[]}
        rowKey="id"
        enableSelection
      />,
    );
    expect(screen.getByRole("grid").hasAttribute("tabindex")).toBe(false);
    expect(screen.getByRole("status")).toBeTruthy();
  });
});
