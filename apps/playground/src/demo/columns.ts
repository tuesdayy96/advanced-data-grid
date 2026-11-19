import type {
  CellChange,
  ColumnDef,
} from "@advanced-data-grid/react-data-grid";
import type { Employee } from "./mockData";

const salaryFormat = new Intl.NumberFormat("en-US");

function required(value: unknown) {
  return (
    (typeof value === "string" && !!value.trim()) || "Enter a non-empty value."
  );
}

export const columns = [
  {
    key: "id",
    header: "ID",
    width: 80,
    filterType: "number",
    pinned: "left",
    resizable: false,
  },
  {
    key: "name",
    pinned: "left",
    minWidth: 100,
    maxWidth: 320,
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
  { key: "status", header: "Status", width: 115, pinned: "right" },
  {
    key: "salary",
    filterType: "number",
    header: "Salary",
    width: 125,
    editable: true,
    editor: "number",
    accessor: (row) => salaryFormat.format(row.salary),
    validate: (value) =>
      (typeof value === "number" && value >= 0) ||
      "Enter a non-negative salary.",
  },
  {
    key: "createdAt",
    pinned: "right",
    filterType: "date",
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
