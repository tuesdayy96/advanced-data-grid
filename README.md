# Advanced Data Grid

React와 TypeScript로 작성한 재사용 가능한 데이터 그리드입니다. Phase 1은 제네릭 공개 API, 시맨틱 HTML 테이블, 독립 CSS, 120행 Playground를 제공합니다.

## 설치 및 사용

패키지명은 `@advanced-data-grid/react-data-grid`입니다. 현재 버전은 0.1.0이며, 로컬에서 생성한 tarball로 설치할 수 있습니다. React 및 React DOM 18.2 이상 또는 19가 필요합니다.

```sh
pnpm build:lib
cd packages/react-data-grid
npm pack
```

별도 React 프로젝트에서 생성된 파일의 경로를 지정해 설치합니다.

```sh
npm install /path/to/advanced-data-grid-react-data-grid-0.1.0.tgz
```

```tsx
import { DataGrid, type ColumnDef } from "@advanced-data-grid/react-data-grid";
import "@advanced-data-grid/react-data-grid/styles.css";

const rows = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
];

type Employee = (typeof rows)[number];

const columns = [
  { key: "id", header: "ID", width: 80 },
  { key: "name", header: "Name", width: 200 },
  {
    key: "initial",
    header: "Initial",
    width: 100,
    accessor: (row) => row.name.slice(0, 1),
  },
] satisfies readonly ColumnDef<Employee>[];

export default function App() {
  return (
    <DataGrid
      columns={columns}
      rows={rows}
      rowKey="id"
      aria-label="Employees"
    />
  );
}
```

### 공개 API

| API                                | 설명                                                                                                                                                 |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DataGrid<T>` / `DataGridProps<T>` | `rows`, `columns`, `rowKey`를 받습니다. `className`, `height`, `aria-label`은 선택 사항입니다.                                                       |
| `ColumnDef<T>`                     | 고유한 문자열 `key`, 헤더 문자열, 픽셀 단위의 양수 `width`를 받습니다. `accessor`를 생략하면 `key`는 행의 필드여야 합니다.                           |
| `RowKey`                           | `string \| number`. `rowKey`에는 이 값을 가진 필드 또는 이 값을 반환하는 함수를 전달합니다. 각 행에 고유하고 순서가 달라져도 일정한 값을 사용합니다. |
| `styles.css`                       | 그리드용 스타일시트입니다. 소비자 프로젝트에서 직접 import합니다.                                                                                    |

문자열과 숫자는 그대로 표시하며 불리언과 bigint는 텍스트로, 날짜는 UTC 기준 ISO 날짜로 표시합니다. `null`, `undefined`, 유효하지 않은 날짜, 배열, 일반 객체는 대시(—)를 표시합니다. 복합 필드는 `accessor`로 표시할 값을 선택할 수 있습니다.

가로 스크롤, 행 호버, 긴 텍스트 말줄임, 빈 상태를 제공합니다. `height`를 지정하면 그리드 영역 안에서 세로로 스크롤할 수 있습니다.

## 로컬 개발

Node.js 22.18 이상과 pnpm 10이 필요합니다. Corepack을 사용하는 경우 `corepack enable pnpm`으로 pnpm 명령을 활성화할 수 있습니다.

| 명령                | 동작                                                                                                           |
| ------------------- | -------------------------------------------------------------------------------------------------------------- |
| `pnpm install`      | 워크스페이스 의존성을 설치합니다.                                                                              |
| `pnpm dev`          | 라이브러리를 빌드하고 Vite Playground를 실행합니다. 라이브러리 변경 후에는 `pnpm build:lib`을 다시 실행합니다. |
| `pnpm build`        | 라이브러리 및 Playground 프로덕션 빌드를 생성합니다.                                                           |
| `pnpm build:lib`    | 라이브러리 ESM, TypeScript 선언, CSS를 생성합니다.                                                             |
| `pnpm typecheck`    | 라이브러리를 빌드하고 워크스페이스 및 테스트의 타입을 검사합니다.                                              |
| `pnpm lint`         | ESLint 검사를 실행합니다.                                                                                      |
| `pnpm format:check` | Prettier 포맷을 검사합니다.                                                                                    |
| `pnpm test`         | Vitest와 React Testing Library 테스트를 실행합니다.                                                            |

## 이후 단계

Phase 2에서는 현재 전체 행 렌더링을 가상 스크롤로 확장할 예정입니다. 행 높이 모델, 헤더를 포함한 스크롤 오프셋, overscan, 부분 렌더링 시의 테이블 접근성을 검토해야 합니다. 선택과 키보드 이동, 편집, 정렬과 필터, 클립보드, 컬럼 조작은 이후 단계의 범위입니다.

[MIT](packages/react-data-grid/LICENSE)
