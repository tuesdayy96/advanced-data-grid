import { DataGrid, type ColumnDef } from "@advanced-data-grid/react-data-grid";
import "@advanced-data-grid/react-data-grid/styles.css";

interface Employee {
  id: number;
  name: string;
}

const rows: Employee[] = [
  { id: 1, name: "Alex Kim" },
  { id: 2, name: "Sam Lee" },
];

const columns = [
  { key: "id", header: "ID", width: 80 },
  { key: "name", header: "Name", width: 180 },
] satisfies ColumnDef<Employee>[];

export function EmployeeGrid() {
  return <DataGrid columns={columns} rows={rows} rowKey="id" height={320} />;
}
