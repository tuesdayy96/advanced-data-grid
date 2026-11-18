import type { ColumnDef, ColumnFilter, SortDescriptor } from "../types/grid";

export const filterOperators = {
  text: ["contains", "equals", "startsWith", "endsWith"],
  number: ["equals", "notEquals", "gt", "gte", "lt", "lte"],
  date: ["equals", "before", "after"],
} as const;

const collator = new Intl.Collator("en", {
  sensitivity: "base",
  numeric: true,
});
const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const isoTimestamp =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
const day = 86_400_000;

export function normalizeText(text: string) {
  return text.normalize("NFC").toLowerCase();
}

function dateTime(value: unknown): number {
  if (value instanceof Date) return value.getTime();
  if (
    typeof value !== "string" ||
    (!isoDate.test(value) && !isoTimestamp.test(value))
  )
    return NaN;
  const calendarDate = value.slice(0, 10);
  const start = new Date(`${calendarDate}T00:00:00Z`);
  if (
    !Number.isFinite(start.getTime()) ||
    start.toISOString().slice(0, 10) !== calendarDate
  )
    return NaN;
  return Date.parse(value);
}

export function getNextSorting(
  current: readonly SortDescriptor[],
  columnKey: string,
  multiple: boolean,
): SortDescriptor[] {
  const previous = current.find((sort) => sort.columnKey === columnKey);
  if (!previous || (!multiple && current.length > 1))
    return [...(multiple ? current : []), { columnKey, direction: "asc" }];
  if (!multiple)
    return previous.direction === "asc"
      ? [{ columnKey, direction: "desc" }]
      : [];
  return previous.direction === "asc"
    ? current.map((sort) =>
        sort === previous ? { columnKey, direction: "desc" } : sort,
      )
    : current.filter((sort) => sort !== previous);
}

function rawValue<T extends object>(column: ColumnDef<T>, row: T): unknown {
  return Reflect.get(row, column.key);
}

type SortValue = string | number | undefined;

function getSortValue(value: unknown): SortValue {
  if (typeof value === "number")
    return Number.isFinite(value) ? value : undefined;
  if (
    value instanceof Date ||
    (typeof value === "string" &&
      (isoDate.test(value) || isoTimestamp.test(value)))
  ) {
    const time = dateTime(value);
    return Number.isFinite(time) ? time : undefined;
  }
  if (typeof value === "string") return value.normalize("NFC");
  return undefined;
}

function compare(a: SortValue, b: SortValue, descending: boolean) {
  if (a === b) return 0;
  if (a === undefined) return 1;
  if (b === undefined) return -1;
  const result =
    typeof a === "number"
      ? typeof b === "number"
        ? a - b
        : -1
      : typeof b === "number"
        ? 1
        : collator.compare(a, b);
  return descending ? -result : result;
}

export function createColumnFilter(
  columnKey: string,
  kind: ColumnFilter["kind"],
  operator: ColumnFilter["operator"],
  draft: string,
): ColumnFilter | undefined {
  const text = draft.trim();
  if (!text) return;
  switch (kind) {
    case "text":
      if (
        operator === "contains" ||
        operator === "equals" ||
        operator === "startsWith" ||
        operator === "endsWith"
      ) {
        return { columnKey, kind, operator, value: text };
      }
      break;
    case "number": {
      const value = Number(text);
      if (
        Number.isFinite(value) &&
        /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(text) &&
        (operator === "equals" ||
          operator === "notEquals" ||
          operator === "gt" ||
          operator === "gte" ||
          operator === "lt" ||
          operator === "lte")
      ) {
        return { columnKey, kind, operator, value };
      }
      break;
    }
    case "date":
      if (
        isoDate.test(text) &&
        Number.isFinite(dateTime(text)) &&
        (operator === "equals" || operator === "before" || operator === "after")
      ) {
        return { columnKey, kind, operator, value: text };
      }
      break;
  }
}

function filterPredicate(filter: ColumnFilter): (value: unknown) => boolean {
  switch (filter.kind) {
    case "text": {
      const expected = normalizeText(filter.value);
      return (value) => {
        if (typeof value !== "string") return false;
        const actual = normalizeText(value);
        switch (filter.operator) {
          case "contains":
            return actual.includes(expected);
          case "equals":
            return actual === expected;
          case "startsWith":
            return actual.startsWith(expected);
          case "endsWith":
            return actual.endsWith(expected);
        }
      };
    }
    case "number":
      return (actual) => {
        if (typeof actual !== "number" || !Number.isFinite(actual))
          return false;
        switch (filter.operator) {
          case "equals":
            return actual === filter.value;
          case "notEquals":
            return actual !== filter.value;
          case "gt":
            return actual > filter.value;
          case "gte":
            return actual >= filter.value;
          case "lt":
            return actual < filter.value;
          case "lte":
            return actual <= filter.value;
        }
      };
    case "date": {
      const expected = Math.floor(dateTime(filter.value) / day);
      return (value) => {
        const actual = Math.floor(dateTime(value) / day);
        switch (filter.operator) {
          case "equals":
            return actual === expected;
          case "before":
            return actual < expected;
          case "after":
            return actual > expected;
        }
      };
    }
  }
}

export function filterRows<T extends object>(
  rows: readonly T[],
  columns: readonly ColumnDef<T>[],
  filters: readonly ColumnFilter[],
  query: string,
): number[] | undefined {
  const search = normalizeText(query.trim());
  if (!filters.length && !search) return;
  const predicates = filters.flatMap((filter) => {
    const column = columns.find(({ key }) => key === filter.columnKey);
    if (
      !column ||
      column.filterable === false ||
      (column.filterType ?? "text") !== filter.kind
    )
      return [];
    const matches = filterPredicate(filter);
    return [
      (row: T) =>
        matches(
          column.filterAccessor
            ? column.filterAccessor(row)
            : rawValue(column, row),
        ),
    ];
  });
  const searchable = search
    ? columns
        .filter((column) => column.searchable !== false)
        .map(
          (column) =>
            column.filterAccessor ?? ((row: T) => rawValue(column, row)),
        )
    : [];
  const normalized = new Map<string, string>();
  function matchesSearch(row: T) {
    for (const read of searchable) {
      const value = read(row);
      if (typeof value !== "string") continue;
      let text = normalized.get(value);
      if (text === undefined) {
        text = normalizeText(value);
        if (normalized.size < 512) normalized.set(value, text);
      }
      if (text.includes(search)) return true;
    }
    return false;
  }

  const result: number[] = [];
  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    if (!predicates.every((predicate) => predicate(row))) continue;
    if (search && !matchesSearch(row)) continue;
    result.push(index);
  }
  return result;
}

export function sortRows<T extends object>(
  rows: readonly T[],
  columns: readonly ColumnDef<T>[],
  sorting: readonly SortDescriptor[],
  filtered: number[] | undefined,
) {
  const descriptors = sorting.flatMap(({ columnKey, direction }) => {
    const column = columns.find(({ key }) => key === columnKey);
    if (!column || column.sortable === false) return [];
    return [
      {
        descending: direction === "desc",
        getValue: (row: T) =>
          getSortValue(
            column.sortAccessor
              ? column.sortAccessor(row)
              : rawValue(column, row),
          ),
      },
    ];
  });
  if (!descriptors.length) return filtered;
  const indexes =
    filtered?.slice() ??
    Array.from({ length: rows.length }, (_, index) => index);
  const keys = descriptors.map(({ getValue }) => {
    const values: SortValue[] = [];
    for (const index of indexes) values[index] = getValue(rows[index]);
    rankRepeatedStrings(values, indexes);
    return values;
  });
  indexes.sort((a, b) => {
    for (let i = 0; i < descriptors.length; i++) {
      const result = compare(keys[i][a], keys[i][b], descriptors[i].descending);
      if (result) return result;
    }
    return a - b;
  });
  return indexes;
}

function rankRepeatedStrings(values: SortValue[], indexes: readonly number[]) {
  const unique = new Set<string>();
  for (const index of indexes) {
    const value = values[index];
    if (value === undefined) continue;
    if (typeof value !== "string" || unique.size > 2048) return;
    unique.add(value);
  }
  if (unique.size === 0 || unique.size * 4 > indexes.length) return;

  // Collate repeated text once, retaining equal ranks for stable ties.
  const ranks = new Map<string, number>();
  const sorted = Array.from(unique).sort(collator.compare);
  let rank = 0;
  for (let index = 0; index < sorted.length; index++) {
    if (index > 0 && collator.compare(sorted[index - 1], sorted[index]) !== 0)
      rank++;
    ranks.set(sorted[index], rank);
  }
  for (const index of indexes) {
    const value = values[index];
    if (typeof value === "string") values[index] = ranks.get(value);
  }
}
