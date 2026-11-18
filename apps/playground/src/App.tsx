import { useEffect, useRef, useState } from "react";
import { DataGrid } from "@advanced-data-grid/react-data-grid";
import { columns } from "./demo/columns";
import { GridMetrics } from "./demo/GridMetrics";
import { createEmployees, prepareEmployees } from "./demo/mockData";

const sizes = [100, 1_000, 10_000, 100_000];
const numberFormat = new Intl.NumberFormat("en-US");

function createDemo(count: number) {
  const start = performance.now();
  const rows = createEmployees(count);
  return { rows, generationMs: performance.now() - start };
}

const initialDemo = createDemo(sizes[0]);

export function App() {
  const [demo, setDemo] = useState(initialDemo);
  const [selectedSize, setSelectedSize] = useState(sizes[0]);
  const demoRef = useRef<HTMLDivElement>(null);
  const preparing = selectedSize !== demo.rows.length;

  useEffect(() => {
    if (!preparing) return;
    return prepareEmployees(selectedSize, (rows, generationMs) => {
      setDemo({ rows, generationMs });
    });
  }, [preparing, selectedSize]);

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
              aria-label="Employee records"
              columns={columns}
              rows={demo.rows}
              rowKey="id"
              height="min(540px, 65vh)"
            />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            Scroll to browse the directory. Hover over a truncated cell to see
            its full value.
          </p>
        </section>
      </main>
    </div>
  );
}
