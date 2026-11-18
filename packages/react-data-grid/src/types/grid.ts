export type RowKey = string | number;

type CellValue = string | number | bigint | boolean | Date | null | undefined;

type RowKeyField<T> = {
  [K in keyof T]-?: T[K] extends RowKey ? K : never;
}[keyof T];

export type ColumnDef<T> = {
  header: string;
  width: number;
} & (
  | { key: Extract<keyof T, string>; accessor?: never }
  | { key: string; accessor: (row: T) => CellValue }
);

export interface DataGridProps<T extends object> {
  columns: readonly ColumnDef<T>[];
  rows: readonly T[];
  rowKey: RowKeyField<T> | ((row: T) => RowKey);
  className?: string;
  height?: number | string;
  "aria-label"?: string;
}
