# Advanced Data Grid

React와 TypeScript로 작성한 재사용 가능한 데이터 그리드입니다. 시맨틱 HTML 테이블, 독립 CSS, 세로 가상 스크롤, 셀 선택, 키보드 탐색, 셀 편집을 제공합니다. Playground에서는 최대 100,000행으로 기능을 체험할 수 있습니다.

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
| `DataGrid<T>` / `DataGridProps<T>` | `rows`, `columns`, `rowKey`를 받습니다. `className`, `height`, `aria-label`, `enableSelection`은 선택 사항입니다.                                    |
| `ColumnDef<T>`                     | 고유한 문자열 `key`, 헤더 문자열, 픽셀 단위의 양수 `width`를 받습니다. `accessor`를 생략하면 `key`는 행의 필드여야 합니다.                           |
| `RowKey`                           | `string \| number`. `rowKey`에는 이 값을 가진 필드 또는 이 값을 반환하는 함수를 전달합니다. 각 행에 고유하고 순서가 달라져도 일정한 값을 사용합니다. |
| `styles.css`                       | 그리드용 스타일시트입니다. 소비자 프로젝트에서 직접 import합니다.                                                                                    |

문자열과 숫자는 그대로 표시하며 불리언과 bigint는 텍스트로, 날짜는 UTC 기준 ISO 날짜로 표시합니다. `null`, `undefined`, 유효하지 않은 날짜, 배열, 일반 객체는 대시(—)를 표시합니다. 복합 필드는 `accessor`로 표시할 값을 선택할 수 있습니다.

가로 스크롤, 행 호버, 긴 텍스트 말줄임, 빈 상태를 제공합니다. `height`를 지정하면 그리드 영역 안에서 세로로 스크롤할 수 있습니다.

### 셀 선택과 키보드 이동

`enableSelection`을 전달하면 그리드에 키보드 포커스와 셀 선택을 활성화합니다. Playground의 **Grid options**에서 이 옵션을 켜고 끌 수 있습니다. 새 boolean prop은 [설정 목록](apps/playground/src/demo/gridFlags.ts)에 추가하면 체크박스로 표시됩니다.

| 입력                     | 동작                                                                                |
| ------------------------ | ----------------------------------------------------------------------------------- |
| 클릭                     | 한 셀을 활성화하고 범위의 시작점으로 지정                                           |
| 드래그, Shift + 클릭     | 시작점과 활성 셀 사이의 직사각형 선택. 드래그 중 위아래 가장자리에서 스크롤         |
| 방향키                   | 한 셀 이동. Shift와 함께 누르면 기존 시작점을 기준으로 범위 확장 또는 축소          |
| Tab / Shift + Tab        | 행 경계를 이어 다음 또는 이전 셀로 이동. 첫 셀과 마지막 셀에서는 그리드 밖으로 이동 |
| Enter / Shift + Enter    | 같은 컬럼의 아래 또는 위 셀로 이동                                                  |
| Home / End               | 현재 행의 첫 셀 또는 마지막 셀로 이동                                               |
| Ctrl + Home / Ctrl + End | 전체 그리드의 첫 셀 또는 마지막 셀로 이동                                           |

선택은 현재 표시 순서의 행과 컬럼 좌표를 기준으로 유지합니다. 가상 스크롤로 셀이 DOM에서 빠져도 선택은 유지되며, 키보드로 화면 밖 셀을 이동하면 해당 위치까지 스크롤합니다. 선택 좌표가 행이나 컬럼 개수의 범위를 벗어나면 선택을 해제합니다.

### 셀 편집

`enableSelection`과 `enableEditing`을 함께 전달하고, 대상 컬럼에 `editable: true` 또는 행을 받는 조건 함수를 설정합니다. Playground의 **Grid options**에서 두 기능을 제어할 수 있습니다.

```tsx
const columns = [
  { key: "id", header: "ID", width: 80 },
  { key: "name", header: "Name", width: 200, editable: true },
] satisfies ColumnDef<Employee>[];

<DataGrid
  columns={columns}
  rows={rows}
  rowKey="id"
  enableSelection
  enableEditing
  onCellChange={({ rowKey, columnKey, value }) => {
    if (columnKey !== "name" || typeof value !== "string") return;
    setRows((previous) =>
      previous.map((row) =>
        row.id === rowKey ? { ...row, name: value } : row,
      ),
    );
  }}
/>;
```

- 더블 클릭, Enter, F2로 편집을 시작합니다. 읽기 전용 셀에서는 Enter의 기존 이동 동작이 유지됩니다.
- 편집 중 Enter는 확정, Escape는 취소, Tab과 Shift+Tab은 확정 후 인접 셀로 이동합니다. 검증 실패 시 키보드 확정과 셀 이동이 차단됩니다.
- 입력이 포커스를 잃거나 가상화로 편집 행이 렌더링 범위를 벗어나면 유효한 변경을 확정합니다. 유효하지 않은 입력은 폐기하고 오류를 그리드 아래에 표시합니다. 편집 대상이 제거되거나 원본 값이 외부에서 바뀌면 편집을 종료합니다.
- `editor`로 `text`, `number`, `date`를 지정할 수 있습니다. 생략하면 원본 값에 따라 선택합니다. 숫자는 커밋 시 유한한 값으로 변환하며 빈 입력은 거부합니다. 날짜는 `YYYY-MM-DD`로 입력합니다. 기존 `Date`는 UTC 시간 부분을 유지한 새 `Date`로 반환하고, 날짜 전용 문자열은 문자열로 반환합니다.
- 편집 초기값은 실제 필드에서 읽습니다. 계산 컬럼을 편집하려면 `valueGetter`와 `valueParser`를 함께 지정합니다. `valueParser`에서 오류를 던지거나 `validate`에서 `false` 또는 오류 문자열을 반환하면 변경을 거부합니다. `validate`는 파싱된 값과 행을 받습니다.
- `onCellChange`는 값이 달라졌을 때만 `CellChange<T>`를 전달합니다. 이벤트는 `rowKey`, `rowIndex`, `columnKey`, `previousValue`, `value`, `row`를 포함합니다. 편집 종료 후에는 호출자가 전달한 `rows`를 표시합니다.

## 로컬 개발

Node.js 22.18 이상과 pnpm 10이 필요합니다. Corepack을 사용하는 경우 `corepack enable pnpm`으로 pnpm 명령을 활성화할 수 있습니다.

| 명령                | 동작                                                                                                                    |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `pnpm install`      | 워크스페이스 의존성을 설치합니다.                                                                                       |
| `pnpm dev`          | 라이브러리를 빌드하고 Vite Playground를 실행합니다. 개발 서버는 워크스페이스의 라이브러리 소스와 CSS 변경을 반영합니다. |
| `pnpm build`        | 라이브러리 및 Playground 프로덕션 빌드를 생성합니다.                                                                    |
| `pnpm build:lib`    | 라이브러리 ESM, TypeScript 선언, CSS를 생성합니다.                                                                      |
| `pnpm typecheck`    | 라이브러리를 빌드하고 워크스페이스 및 테스트의 타입을 검사합니다.                                                       |
| `pnpm lint`         | ESLint 검사를 실행합니다.                                                                                               |
| `pnpm format:check` | Prettier 포맷을 검사합니다.                                                                                             |
| `pnpm test`         | Vitest와 React Testing Library 테스트를 실행합니다.                                                                     |

## 이후 단계

이후 단계에서는 정렬과 필터, 클립보드, 컬럼 조작을 다룹니다.

[MIT](packages/react-data-grid/LICENSE)
