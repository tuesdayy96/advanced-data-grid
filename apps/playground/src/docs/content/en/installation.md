## Install from a local tarball

Build and pack the library from the repository root with Node.js 22.18+ and pnpm 10.

```sh
pnpm install
pnpm build:lib
pnpm --filter @advanced-data-grid/react-data-grid pack
```

Copy the generated `.tgz` into the consuming app and use one of these commands. The example filename uses the current workspace version.

```sh
npm install ./advanced-data-grid-react-data-grid-0.1.0.tgz
pnpm add ./advanced-data-grid-react-data-grid-0.1.0.tgz
yarn add ./advanced-data-grid-react-data-grid-0.1.0.tgz
```

The public registry did not resolve the workspace package name during Phase 7.5. Install by name after the package scope, name, and release are confirmed and published.

## Runtime and stylesheet

Install matching `react` and `react-dom` versions in the app. Both are peers with range `^18.2.0 || ^19.0.0`. The Quick Start and editing examples were rendered with the local tarball on React 18.3.1 and 19.3.1. The package provides an ESM entry point and TypeScript declarations. Import its stylesheet once at the app entry point.

```ts
import "@advanced-data-grid/react-data-grid/styles.css";
```

[Render your first grid](/docs/en/quick-start).
