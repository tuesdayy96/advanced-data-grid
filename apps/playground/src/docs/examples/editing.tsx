import { useState } from "react";
import {
  DataGrid,
  type CellChange,
  type ColumnDef,
} from "@advanced-data-grid/react-data-grid";
import "@advanced-data-grid/react-data-grid/styles.css";

interface Employee {
  id: number;
  name: string;
}

const columns = [
  {
    key: "name",
    header: "Name",
    width: 180,
    editable: true,
    editor: "text",
    valueParser: (draft) => draft.trim(),
    validate: (value) =>
      (typeof value === "string" && value.length > 0) || "Enter a name.",
  },
] satisfies ColumnDef<Employee>[];

export function EditableGrid() {
  const [rows, setRows] = useState<Employee[]>([{ id: 1, name: "Alex Kim" }]);

  function applyChange({ rowKey, columnKey, value }: CellChange<Employee>) {
    if (columnKey !== "name" || typeof value !== "string") return;

    setRows((previous) =>
      previous.map((row) =>
        row.id === rowKey ? { ...row, name: value } : row,
      ),
    );
  }

  return (
    <DataGrid
      columns={columns}
      rows={rows}
      rowKey="id"
      height={320}
      enableSelection
      enableEditing
      onCellChange={applyChange}
    />
  );
}
