import type { DataGridProps } from "@advanced-data-grid/react-data-grid";
import type { Employee } from "./mockData";

type GridProps = DataGridProps<Employee>;
type BooleanGridProp = {
  [Key in keyof GridProps]-?: GridProps[Key] extends boolean | undefined
    ? Key
    : never;
}[keyof GridProps];

export const gridFlags = [
  {
    prop: "enableSelection",
    label: "Cell selection and keyboard navigation",
    defaultValue: true,
  },
  {
    prop: "enableEditing",
    label: "Cell editing (requires selection)",
    defaultValue: true,
  },
  { prop: "enableSorting", label: "Column sorting", defaultValue: true },
  { prop: "enableFiltering", label: "Column filtering", defaultValue: true },
] as const satisfies readonly {
  prop: BooleanGridProp;
  label: string;
  defaultValue: boolean;
}[];

export type GridFlags = Record<(typeof gridFlags)[number]["prop"], boolean>;

export const defaultGridFlags = Object.fromEntries(
  gridFlags.map(({ prop, defaultValue }) => [prop, defaultValue]),
) as GridFlags;
