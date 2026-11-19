# Advanced Data Grid

A React and TypeScript data grid with row virtualization, keyboard navigation, cell selection, editing, sorting and filtering, TSV clipboard copy, column resizing, and pinning.

## Installation

Version `0.1.0` is being prepared for public release. Use a local tarball during release testing.

```sh
npm install ./advanced-data-grid-react-data-grid-0.1.0.tgz
pnpm add ./advanced-data-grid-react-data-grid-0.1.0.tgz
yarn add ./advanced-data-grid-react-data-grid-0.1.0.tgz
```

Once the release is on the public registry, install `@advanced-data-grid/react-data-grid` by name.

```sh
npm install @advanced-data-grid/react-data-grid
pnpm add @advanced-data-grid/react-data-grid
yarn add @advanced-data-grid/react-data-grid
```

## Quick Start

```tsx
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
```

Use a unique, stable `rowKey`. A bounded `height` provides a scrollable viewport.

## Compatibility

The package exports ESM, TypeScript declarations and standalone CSS. Use matching versions of React and React DOM within `^18.2.0 || ^19.0.0`. Virtualization uses fixed-height rows. Clipboard supports TSV copy. Paste and direct XLSX import are outside the public API. Large TSV selections can occupy the main thread during serialization.

## Playground and documentation

Try the [Playground](https://advanced-data-grid-ten.vercel.app/), read the [English docs](https://advanced-data-grid-ten.vercel.app/docs/en) or [한국어 문서](https://advanced-data-grid-ten.vercel.app/docs/ko), and report issues on [GitHub](https://github.com/tuesdayy96/advanced-data-grid/issues).

## License

[MIT](LICENSE)
