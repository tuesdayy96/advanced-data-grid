import type {
  CellChange,
  ColumnDef,
} from "@advanced-data-grid/react-data-grid";
import type { Employee } from "./mockData";

function required(value: unknown) {
  return (
    (typeof value === "string" && !!value.trim()) || "Enter a non-empty value."
  );
}

export const columns = [
  { key: "id", header: "ID", width: 80 },
  {
    key: "name",
    header: "Name",
    width: 180,
    editable: true,
    validate: required,
  },
  { key: "email", header: "Email", width: 240 },
  {
    key: "department",
    header: "Department",
    width: 162,
    editable: true,
    validate: required,
  },
  {
    key: "role",
    header: "Role",
    width: 234,
    editable: true,
    validate: required,
  },
  { key: "status", header: "Status", width: 115 },
  {
    key: "salary",
    header: "Salary",
    width: 125,
    editable: true,
    editor: "number",
    accessor: (row) => row.salary.toLocaleString("en-US"),
    validate: (value) =>
      (typeof value === "number" && value >= 0) ||
      "Enter a non-negative salary.",
  },
  {
    key: "createdAt",
    header: "Created at",
    width: 131,
    editable: true,
    editor: "date",
  },
] satisfies readonly ColumnDef<Employee>[];

export function applyEmployeeChange(
  row: Employee,
  { columnKey, value }: CellChange<Employee>,
): Employee {
  switch (columnKey) {
    case "name":
    case "department":
    case "role":
      if (typeof value === "string") return { ...row, [columnKey]: value };
      break;
    case "salary":
      if (typeof value === "number") return { ...row, salary: value };
      break;
    case "createdAt":
      if (value instanceof Date) return { ...row, createdAt: value };
      break;
  }
  return row;
}
