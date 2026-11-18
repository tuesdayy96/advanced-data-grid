import type { ColumnDef } from "@advanced-data-grid/react-data-grid";
import type { Employee } from "./mockData";

export const columns = [
  { key: "id", header: "ID", width: 80 },
  { key: "name", header: "Name", width: 180 },
  { key: "email", header: "Email", width: 240 },
  { key: "department", header: "Department", width: 162 },
  { key: "role", header: "Role", width: 234 },
  { key: "status", header: "Status", width: 115 },
  { key: "createdAt", header: "Created at", width: 131 },
] satisfies readonly ColumnDef<Employee>[];
