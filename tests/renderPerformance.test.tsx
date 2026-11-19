import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { DataGrid, type ColumnDef } from "../packages/react-data-grid/src";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("reuses visible cell formatting through navigation and column resizing", async () => {
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(244);
  const rows = Array.from({ length: 100_000 }, (_, id) => ({ id }));
  const accessor = vi.fn((row: (typeof rows)[number]) => row.id);
  const columns = [
    { key: "id", header: "ID", width: 80, accessor },
  ] satisfies ColumnDef<(typeof rows)[number]>[];
  render(
    <DataGrid
      columns={columns}
      rows={rows}
      rowKey="id"
      height={244}
      enableSelection
      enableColumnResize
    />,
  );
  const grid = screen.getByRole("grid");
  const initialCalls = accessor.mock.calls.length;
  expect(initialCalls).toBe(10);
  act(() => grid.focus());
  fireEvent.keyDown(grid, { key: "ArrowDown" });
  const handle = within(grid).getByRole("button", { name: "Resize ID" });
  fireEvent.keyDown(handle, { key: "ArrowRight" });
  expect(accessor).toHaveBeenCalledTimes(initialCalls);
  fireEvent.scroll(grid.parentElement!, { target: { scrollTop: 40 } });
  expect(accessor).toHaveBeenCalledTimes(initialCalls + 1);
  expect(within(grid).getByRole("gridcell", { name: "10" })).toBeTruthy();
});

it("cleans up copy and resize listeners, observers, frame and captured pointer on unmount", () => {
  const observe = vi.fn();
  const disconnect = vi.fn();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe = observe;
      disconnect = disconnect;
    },
  );
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn(() => 73),
  );
  const cancel = vi.fn();
  vi.stubGlobal("cancelAnimationFrame", cancel);
  const added = vi.spyOn(window, "addEventListener");
  const removed = vi.spyOn(window, "removeEventListener");
  const addedDocument = vi.spyOn(document, "addEventListener");
  const removedDocument = vi.spyOn(document, "removeEventListener");
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(244);
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(400);

  const rows = [{ id: 1 }];
  const columns = [
    { key: "id", header: "ID", width: 80, pinned: "left" },
  ] satisfies ColumnDef<(typeof rows)[number]>[];
  const { unmount } = render(
    <DataGrid
      columns={columns}
      rows={rows}
      rowKey="id"
      height={244}
      enableSelection
      enableClipboard
      enableColumnResize
    />,
  );
  const handle = screen.getByRole("button", { name: "Resize ID" });
  const capture = vi.fn();
  const release = vi.fn();
  Object.assign(handle, {
    setPointerCapture: capture,
    hasPointerCapture: () => true,
    releasePointerCapture: release,
  });
  fireEvent.pointerDown(handle, { pointerId: 2, button: 0, clientX: 100 });
  fireEvent.pointerMove(window, { pointerId: 2, clientX: 120 });
  unmount();

  expect(observe).toHaveBeenCalledTimes(2);
  expect(disconnect).toHaveBeenCalledTimes(2);
  expect(capture).toHaveBeenCalledWith(2);
  expect(release).toHaveBeenCalledWith(2);
  expect(cancel).toHaveBeenCalledWith(73);
  for (const [type, listener] of added.mock.calls.filter(([type]) =>
    type.startsWith("pointer"),
  )) {
    expect(removed).toHaveBeenCalledWith(type, listener);
  }
  const copy = addedDocument.mock.calls.find(([type]) => type === "copy");
  expect(copy?.[1]).toBeTruthy();
  expect(removedDocument).toHaveBeenCalledWith("copy", copy?.[1]);
});
