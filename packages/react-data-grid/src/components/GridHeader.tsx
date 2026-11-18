import type { ColumnDef } from "../types/grid";

export function GridHeader<T>({
  columns,
  rowIndex,
}: {
  columns: readonly ColumnDef<T>[];
  rowIndex?: number;
}) {
  return (
    <thead>
      <tr aria-rowindex={rowIndex}>
        {columns.map((column) => (
          <th scope="col" key={column.key} title={column.header}>
            {column.header}
          </th>
        ))}
      </tr>
    </thead>
  );
}
