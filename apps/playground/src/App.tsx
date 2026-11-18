import { useEffect, useRef, useState } from "react";
import { DataGrid, type CellChange } from "@advanced-data-grid/react-data-grid";
import { applyEmployeeChange, columns } from "./demo/columns";
import { defaultGridFlags, gridFlags } from "./demo/gridFlags";
import { GridMetrics } from "./demo/GridMetrics";
import {
  createEmployees,
  prepareEmployees,
  type Employee,
} from "./demo/mockData";

const sizes = [100, 1_000, 10_000, 100_000];
const numberFormat = new Intl.NumberFormat("en-US");

function createDemo(count: number) {
  const start = performance.now();
  const rows = createEmployees(count);
  return { rows, generationMs: performance.now() - start };
}

function displayChangeValue(value: unknown) {
  if (value instanceof Date) return value.toISOString().split("T")[0];
  return typeof value === "number" || typeof value === "string"
    ? String(value)
    : "Empty";
}

const initialDemo = createDemo(sizes[0]);

export function App() {
  const [demo, setDemo] = useState(initialDemo);
  const [selectedSize, setSelectedSize] = useState(sizes[0]);
  const [flags, setFlags] = useState(defaultGridFlags);
  const [lastChange, setLastChange] = useState<CellChange<Employee>>();
  const demoRef = useRef<HTMLDivElement>(null);
  const preparing = selectedSize !== demo.rows.length;

  useEffect(() => {
    if (!preparing) return;
    return prepareEmployees(selectedSize, (rows, generationMs) => {
      setDemo({ rows, generationMs });
      setLastChange(undefined);
    });
  }, [preparing, selectedSize]);

  function onCellChange(change: CellChange<Employee>) {
    setDemo((previous) => {
      const row = previous.rows[change.rowIndex];
      if (row?.id !== change.rowKey) return previous;
      const next = applyEmployeeChange(row, change);
      if (next === row) return previous;
      const rows = previous.rows.slice();
      rows[change.rowIndex] = next;
      return { ...previous, rows };
    });
    setLastChange(change);
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1220px] items-center gap-3 px-6 py-5">
          <span
            aria-hidden="true"
            className="grid size-8 grid-cols-2 gap-1 rounded-lg bg-indigo-700 p-2"
          >
            <span className="rounded-xs bg-white" />
            <span className="rounded-xs bg-indigo-300" />
            <span className="rounded-xs bg-indigo-300" />
            <span className="rounded-xs bg-white" />
          </span>
          <span className="text-sm font-semibold tracking-wide">
            Advanced Data Grid
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-[1220px] px-6 pt-12 pb-10 sm:pt-16">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Employee directory
        </h1>
        <p className="mt-4 max-w-xl leading-relaxed text-slate-600">
          Browse up to 100,000 sample employees. The grid renders the visible
          rows and adds a small buffer for scrolling.
        </p>
        <section aria-labelledby="records-heading" className="mt-9">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="records-heading" className="text-lg font-semibold">
              Employee records
            </h2>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              Dataset size
              <select
                className="rounded-md border border-slate-300 bg-white px-2 py-1.5"
                value={selectedSize}
                onChange={(event) =>
                  setSelectedSize(Number(event.target.value))
                }
              >
                {sizes.map((size) => (
                  <option key={size} value={size}>
                    {numberFormat.format(size)} rows
                  </option>
                ))}
              </select>
            </label>
          </div>
          <fieldset className="mb-4 rounded-lg border border-slate-200 bg-white px-4 pb-3">
            <legend className="px-1 text-sm font-semibold text-slate-800">
              Grid options
            </legend>
            <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
              {gridFlags.map(({ prop, label }) => (
                <label
                  key={prop}
                  className="flex cursor-pointer items-start gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 size-4 accent-indigo-700"
                    checked={flags[prop]}
                    onChange={({ currentTarget: { checked } }) =>
                      setFlags((previous) => ({ ...previous, [prop]: checked }))
                    }
                  />
                  <span>
                    {label}
                    <code className="ml-2 text-xs text-slate-600">{prop}</code>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <p className="mb-3 text-sm text-slate-600">
            {numberFormat.format(demo.rows.length)} total rows &middot; Virtual
            scrolling enabled &middot; Data generation{" "}
            {demo.generationMs.toFixed(1)} ms
          </p>
          {preparing && (
            <p role="status" className="mb-3 text-sm text-slate-600">
              Preparing {numberFormat.format(selectedSize)} rows...
            </p>
          )}
          <GridMetrics demoRef={demoRef} total={demo.rows.length} />
          <div ref={demoRef}>
            <DataGrid
              key={demo.rows.length}
              aria-label="Employee records"
              columns={columns}
              rows={demo.rows}
              rowKey="id"
              onCellChange={onCellChange}
              {...flags}
              height="min(540px, 65vh)"
            />
          </div>
          {flags.enableSelection && (
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Click a cell or press Tab to focus the grid. Drag to select a
              range, or use the arrow keys to move and Shift + arrows to extend
              the selection. Use Ctrl + Home or Ctrl + End to jump to the first
              or last cell.
            </p>
          )}
          {flags.enableSelection && flags.enableEditing && (
            <p className="mt-2 text-sm text-slate-600">
              Double-click an editable cell or press Enter or F2 to edit. Press
              Escape to cancel.
            </p>
          )}
          {lastChange && (
            <p role="status" className="mt-2 text-sm text-slate-700">
              Row {lastChange.rowKey} / {lastChange.columnKey}:{" "}
              {displayChangeValue(lastChange.previousValue)} to{" "}
              {displayChangeValue(lastChange.value)}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
