export type RowKey = string | number;

type CellValue = string | number | bigint | boolean | Date | null | undefined;

type RowKeyField<T> = {
  [K in keyof T]-?: T[K] extends RowKey ? K : never;
}[keyof T];

export type SortDirection = "asc" | "desc";
export type SortDescriptor = { columnKey: string; direction: SortDirection };
export type ColumnFilter = { columnKey: string } & (
  | {
      kind: "text";
      operator: "contains" | "equals" | "startsWith" | "endsWith";
      value: string;
    }
  | {
      kind: "number";
      operator: "equals" | "notEquals" | "gt" | "gte" | "lt" | "lte";
      value: number;
    }
  | { kind: "date"; operator: "equals" | "before" | "after"; value: string }
);
export type FilterOperator = ColumnFilter["operator"];

export type ColumnDef<T> = {
  header: string;
  width: number;
  sortable?: boolean;
  sortAccessor?: (row: T) => unknown;
  filterable?: boolean;
  filterType?: ColumnFilter["kind"];
  filterAccessor?: (row: T) => unknown;
  searchable?: boolean;
  editable?: boolean | ((row: T) => boolean);
  editor?: "text" | "number" | "date";
  valueGetter?: (row: T) => unknown;
  valueParser?: (draft: string, row: T) => unknown;
  validate?: (value: unknown, row: T) => boolean | string;
} & (
  | { key: Extract<keyof T, string>; accessor?: never }
  | { key: string; accessor: (row: T) => CellValue }
);

export interface CellChange<T> {
  rowKey: RowKey;
  rowIndex: number;
  columnKey: string;
  previousValue: unknown;
  value: unknown;
  row: T;
}

export interface DataGridProps<T extends object> {
  columns: readonly ColumnDef<T>[];
  rows: readonly T[];
  rowKey: RowKeyField<T> | ((row: T) => RowKey);
  className?: string;
  enableSelection?: boolean;
  enableEditing?: boolean;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  searchQuery?: string;
  onSortChange?: (sorting: readonly SortDescriptor[]) => void;
  onFilterChange?: (filters: readonly ColumnFilter[]) => void;
  onCellChange?: (change: CellChange<T>) => void;
  height?: number | string;
  "aria-label"?: string;
}
