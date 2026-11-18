import type { MouseEvent } from "react";
import type { ColumnDef, ColumnFilter, SortDescriptor } from "../types/grid";

export function GridHeader<T>({
  columns,
  rowIndex,
  sorting,
  filters,
  onSort,
  onFilter,
  filterPanel,
}: {
  columns: readonly ColumnDef<T>[];
  rowIndex?: number;
  sorting?: readonly SortDescriptor[];
  filters?: readonly ColumnFilter[];
  onSort?: (key: string, multiple: boolean) => void;
  onFilter?: (key: string, event: MouseEvent<HTMLButtonElement>) => void;
  filterPanel?: { key: string; id: string };
}) {
  return (
    <thead>
      <tr aria-rowindex={rowIndex}>
        {columns.map((column) => {
          const sorted =
            sorting?.findIndex(({ columnKey }) => columnKey === column.key) ??
            -1;
          const sort = sorting?.[sorted];
          const canSort = onSort && column.sortable !== false;
          const canFilter = onFilter && column.filterable !== false;
          const filtered = filters?.some(
            ({ columnKey }) => columnKey === column.key,
          );
          const expanded = filterPanel?.key === column.key;
          return (
            <th
              scope="col"
              key={column.key}
              title={column.header}
              aria-sort={
                sorted === 0
                  ? sort?.direction === "asc"
                    ? "ascending"
                    : "descending"
                  : undefined
              }
            >
              {canSort || canFilter ? (
                <div className="adg-header-controls">
                  {canSort ? (
                    <button
                      className="adg-sort-button"
                      type="button"
                      aria-label={`Sort by ${column.header}${sort ? `, ${sort.direction === "asc" ? "ascending" : "descending"}, priority ${sorted + 1}` : ""}`}
                      onClick={(event) => onSort(column.key, event.shiftKey)}
                    >
                      <span>{column.header}</span>
                      <span aria-hidden="true">
                        {sort?.direction === "asc"
                          ? "↑"
                          : sort?.direction === "desc"
                            ? "↓"
                            : "↕"}
                        {sort && (sorting?.length ?? 0) > 1 ? sorted + 1 : ""}
                      </span>
                    </button>
                  ) : (
                    <span>{column.header}</span>
                  )}
                  {canFilter && (
                    <button
                      className="adg-filter-button"
                      type="button"
                      aria-label={`Filter ${column.header}${filtered ? ", active" : ""}`}
                      aria-expanded={expanded}
                      aria-controls={expanded ? filterPanel?.id : undefined}
                      data-filtered={filtered || undefined}
                      onClick={(event) => onFilter(column.key, event)}
                    >
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 16 16"
                        width="14"
                        height="14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M2 3h12L9.5 8v4l-3 1V8z" />
                      </svg>
                    </button>
                  )}
                </div>
              ) : (
                column.header
              )}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
