export type RowKey = string | number;

type CellValue = string | number | bigint | boolean | Date | null | undefined;

type RowKeyField<T> = {
  [K in keyof T]-?: T[K] extends RowKey ? K : never;
}[keyof T];

export type ColumnDef<T> = {
  header: string;
  width: number;
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
  onCellChange?: (change: CellChange<T>) => void;
  height?: number | string;
  "aria-label"?: string;
}
