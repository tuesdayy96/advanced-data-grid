import { koreanFlags, playgroundText, type Locale } from "./i18n";
import { useEffect, useRef, useState } from "react";
import {
  DataGrid,
  type CellChange,
  type ColumnFilter,
  type SortDescriptor,
} from "@advanced-data-grid/react-data-grid";
import { applyEmployeeChange, columns } from "./demo/columns";
import { defaultGridFlags, gridFlags } from "./demo/gridFlags";
import { GridMetrics } from "./demo/GridMetrics";
import {
  createEmployees,
  prepareEmployees,
  type Employee,
} from "./demo/mockData";
import "./demo/gridThemes.css";

const sizes = [100, 1_000, 10_000, 100_000];
const themes = {
  default: { en: "Default", ko: "기본" },
  dark: { en: "Dark", ko: "다크" },
  custom: { en: "Custom", ko: "커스텀" },
};
const numberFormat = new Intl.NumberFormat("en-US");

function createDemo(count: number) {
  const start = performance.now();
  const rows = createEmployees(count);
  return { rows, generationMs: performance.now() - start };
}

function displayChangeValue(value: unknown, empty: string) {
  if (value instanceof Date) return value.toISOString().split("T")[0];
  return typeof value === "number" || typeof value === "string"
    ? String(value)
    : empty;
}

const initialDemo = createDemo(sizes[0]);

const koreanHeaders = {
  id: "ID",
  name: "이름",
  email: "이메일",
  department: "부서",
  role: "직무",
  status: "상태",
  salary: "급여",
  createdAt: "생성일",
} satisfies Record<(typeof columns)[number]["key"], string>;

const koreanColumns = columns.map((column) => ({
  ...column,
  header: koreanHeaders[column.key],
}));

export function PlaygroundPage({ locale }: { locale: Locale }) {
  const t = playgroundText[locale];
  const demoColumns = locale === "ko" ? koreanColumns : columns;
  const [demo, setDemo] = useState(initialDemo);
  const [selectedSize, setSelectedSize] = useState(sizes[0]);
  const [theme, setTheme] = useState<keyof typeof themes>("default");
  const [flags, setFlags] = useState(defaultGridFlags);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sorting, setSorting] = useState<readonly SortDescriptor[]>([]);
  const [filters, setFilters] = useState<readonly ColumnFilter[]>([]);
  const [lastChange, setLastChange] = useState<CellChange<Employee>>();
  const demoRef = useRef<HTMLDivElement>(null);
  const preparing = selectedSize !== demo.rows.length;

  useEffect(() => {
    const timer = window.setTimeout(() => setSearchQuery(search), 150);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!preparing) return;
    return prepareEmployees(selectedSize, (rows, generationMs) => {
      setDemo({ rows, generationMs });
      setLastChange(undefined);
      setSorting([]);
      setFilters([]);
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
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto max-w-[1220px] px-6 pt-12 pb-10 sm:pt-16"
    >
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        {t.title}
      </h1>
      <p className="mt-4 max-w-xl leading-relaxed text-slate-600">{t.intro}</p>
      <section aria-labelledby="records-heading" className="mt-9">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="records-heading" className="text-lg font-semibold">
            {t.records}
          </h2>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            {locale === "ko" ? "그리드 테마" : "Grid theme"}
            <select
              className="rounded-md border border-slate-300 bg-white px-2 py-1.5"
              value={theme}
              onChange={(event) =>
                setTheme(event.currentTarget.value as keyof typeof themes)
              }
            >
              {Object.entries(themes).map(([value, name]) => (
                <option key={value} value={value}>
                  {name[locale]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            {t.size}
            <select
              className="rounded-md border border-slate-300 bg-white px-2 py-1.5"
              value={selectedSize}
              onChange={(event) => setSelectedSize(Number(event.target.value))}
            >
              {sizes.map((size) => (
                <option key={size} value={size}>
                  {numberFormat.format(size)} {t.rows}
                </option>
              ))}
            </select>
          </label>
        </div>
        <fieldset className="mb-4 rounded-lg border border-slate-200 bg-white px-4 pb-3">
          <legend className="px-1 text-sm font-semibold text-slate-800">
            {t.options}
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
                  {locale === "en" ? label : koreanFlags[prop]}
                  <code className="ml-2 text-xs text-slate-600">{prop}</code>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <p className="mb-3 text-sm text-slate-600">
          {numberFormat.format(demo.rows.length)} {t.total} &middot; {t.virtual}{" "}
          &middot; {t.generation} {demo.generationMs.toFixed(1)} ms
        </p>
        {preparing && (
          <p role="status" className="mb-3 text-sm text-slate-600">
            {t.preparing} {numberFormat.format(selectedSize)} {t.rows}...
          </p>
        )}
        <div className="mb-4 flex flex-wrap items-end gap-2">
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            {t.search}
            <input
              type="search"
              className="w-64 max-w-full rounded-md border border-slate-300 bg-white px-3 py-1.5"
              value={search}
              onChange={(event) => {
                setSearch(event.currentTarget.value);
                if (!event.currentTarget.value) setSearchQuery("");
              }}
            />
          </label>
          {search && (
            <button
              type="button"
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm"
              onClick={() => {
                setSearch("");
                setSearchQuery("");
              }}
            >
              {t.clear}
            </button>
          )}
        </div>
        {((flags.enableSorting && sorting.length > 0) ||
          (flags.enableFiltering && filters.length > 0)) && (
          <div className="mb-3 space-y-1 text-sm text-slate-700">
            {flags.enableSorting && sorting.length > 0 && (
              <p>
                {t.sort}:{" "}
                {sorting
                  .map(
                    ({ columnKey, direction }) =>
                      `${demoColumns.find(({ key }) => key === columnKey)?.header ?? columnKey} ${direction}`,
                  )
                  .join(", ")}
              </p>
            )}
            {flags.enableFiltering && filters.length > 0 && (
              <p>
                {t.filter}:{" "}
                {filters
                  .map(
                    ({ columnKey, operator, value }) =>
                      `${demoColumns.find(({ key }) => key === columnKey)?.header ?? columnKey} ${operator} ${value}`,
                  )
                  .join(", ")}
              </p>
            )}
          </div>
        )}
        <GridMetrics
          locale={locale}
          demoRef={demoRef}
          total={demo.rows.length}
        />
        <div ref={demoRef} className={`grid-theme-${theme}`}>
          <DataGrid
            key={demo.rows.length}
            aria-label={t.records}
            columns={demoColumns}
            rows={demo.rows}
            rowKey="id"
            onCellChange={onCellChange}
            searchQuery={searchQuery}
            onSortChange={setSorting}
            onFilterChange={setFilters}
            {...flags}
            height="min(540px, 65vh)"
          />
        </div>
        {flags.enableSelection && (
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            {t.selection}
          </p>
        )}
        {flags.enableSelection && flags.enableEditing && (
          <p className="mt-2 text-sm text-slate-600">{t.editing}</p>
        )}
        {flags.enableSelection && flags.enableClipboard && (
          <p className="mt-2 text-sm text-slate-600">{t.clipboard}</p>
        )}
        {flags.enableColumnResize && (
          <p className="mt-2 text-sm text-slate-600">{t.resize}</p>
        )}
        {flags.enableColumnPinning && (
          <p className="mt-2 text-sm text-slate-600">{t.pin}</p>
        )}
        {lastChange && (
          <p role="status" className="mt-2 text-sm text-slate-700">
            {t.row} {lastChange.rowKey} / {lastChange.columnKey}:{" "}
            {displayChangeValue(lastChange.previousValue, t.empty)} {t.to}{" "}
            {displayChangeValue(lastChange.value, t.empty)}
          </p>
        )}
      </section>
    </main>
  );
}
