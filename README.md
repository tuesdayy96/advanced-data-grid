# Advanced Data Grid

A React and TypeScript data grid with semantic table markup, fixed-height row virtualization and standalone CSS.

## Installation

Install from the [public npm registry](https://www.npmjs.com/package/@advanced-data-grid/react-data-grid) with your package manager.

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

## Features

- Virtual scrolling and sticky headers.
- Keyboard navigation, range selection, and text, number, and date editing.
- Multi-column sorting, column filters, and global search.
- TSV clipboard copy, column resizing, pinning, and optional dividers.

## Playground and documentation

Explore the [Playground](https://advanced-data-grid-ten.vercel.app/), [English docs](https://advanced-data-grid-ten.vercel.app/docs/en), and [한국어 문서](https://advanced-data-grid-ten.vercel.app/docs/ko). The site includes public API references, feature guides, and a 100,000-row demo. For local development, run `pnpm dev` from the repository root.

## Compatibility and limitations

- React and React DOM peer ranges are `^18.2.0 || ^19.0.0`. The package provides ESM, TypeScript declarations, and a `styles.css` export.
- The Windows browser suite covers Chromium, Firefox, WebKit, and Edge. Native Safari and manual screen reader checks remain unverified. Windows Firefox axe checks are skipped because the engine crashes during evaluation.
- Virtualization uses fixed-height rows. Clipboard support covers TSV copy. Paste and direct XLSX import are outside the public API. Large TSV copies can occupy the main thread during serialization.

## Development

Use Node.js 22.18+ and pnpm 10.

```sh
pnpm install
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm build:lib
pnpm build
pnpm exec playwright install chromium firefox webkit
pnpm test:e2e
```

Playwright runs against Vite preview by default. Set `ADG_E2E_DEV=1` for the dev server or `ADG_E2E_EDGE=1` to include installed Microsoft Edge. For performance and heap samples, set `ADG_PERF=1` and run `pnpm test:e2e --project=chromium e2e/performance.spec.ts`.

Run `pnpm changeset` for user-facing library changes and include the resulting file in your PR. GitHub Actions runs the same checks on PRs to `main`. See the [release workflow](docs/release-workflow.md) for version PRs, publishing, and recovery.

## Deployment

Vercel serves Playground and both documentation languages as one Vite project. Set Root Directory to `apps/playground`, allow workspace sources outside it, and select Node.js 24.x to match the local release checks. Leave the install command on automatic so Vercel detects pnpm from the workspace lockfile. The app build command builds the library first and writes the site to `apps/playground/dist`. The SPA rewrite handles direct requests under `/docs`. [Vercel configuration](apps/playground/vercel.json)

## Project records

- [Changelog](CHANGELOG.md)
- [Korean API usage notes](docs/grid-usage-notes.md)
- [100,000-row freeze investigation](docs/playground-100k-row-freeze.md)
- [WebKit editing re-entry investigation](docs/webkit-editing-regression.md)

## License

[MIT](LICENSE)
