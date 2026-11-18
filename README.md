# Advanced Data Grid

React와 TypeScript로 작성한 재사용 가능한 데이터 그리드입니다. 시맨틱 HTML 테이블, 독립 CSS, 세로 가상 스크롤, 셀 선택, 키보드 탐색, 셀 편집, 정렬, 필터, 검색을 제공합니다. Playground에서는 최대 100,000행으로 기능을 체험할 수 있습니다.

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

### 정렬, 컬럼 필터, 전역 검색

`enableSorting`과 `enableFiltering`은 기본적으로 꺼져 있습니다. 사용하면 헤더에서 정렬하거나 필터 패널을 열 수 있습니다. `searchQuery`는 앱에서 관리하는 검색어이며 두 옵션과 독립적으로 작동합니다. Playground의 검색 입력에는 150ms 지연을 적용합니다.

| API                                          | 동작                                                                                                     |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `onSortChange`                               | 정렬 우선순위에 따라 정렬 기준 `SortDescriptor` 배열을 전달합니다.                                       |
| `onFilterChange`                             | 적용된 조건 `ColumnFilter` 배열을 전달합니다. 컬럼마다 활성 조건은 하나입니다.                           |
| `sortable`, `sortAccessor`                   | `sortable: false`로 헤더 정렬을 끕니다. `sortAccessor`로 정렬에 사용할 값을 지정할 수 있습니다.          |
| `filterable`, `filterType`, `filterAccessor` | `filterable: false`로 컬럼 필터를 끕니다. `filterType`은 `text`(기본값), `number`, `date` 중 하나입니다. |
| `searchable`                                 | `searchable: false`로 전역 검색 대상에서 제외합니다.                                                     |

일반 클릭은 단일 정렬의 오름차순 → 내림차순 → 해제 순환을 적용합니다. 다중 정렬 상태에서 일반 클릭하면 클릭한 컬럼의 오름차순으로 전환합니다. Shift+클릭하면 기존 우선순위를 유지하면서 기준을 추가하거나 변경합니다. 정렬을 모두 해제하면 필터와 검색에 일치하는 행이 원본 순서로 표시됩니다.

필터와 전역 검색은 AND로 결합하며, 전역 검색은 검색 가능한 문자열 컬럼 중 하나에서 일치하면 됩니다. 문자열 정렬은 대소문자를 구분하지 않고 숫자가 섞인 이름을 자연 순서로 처리합니다. 숫자는 실제 숫자로 정렬합니다. 날짜는 `Date`, 유효한 ISO 날짜 전용 문자열, 타임존을 포함한 ISO 시각 문자열을 지원합니다. 날짜 정렬은 시각을 비교하고 날짜 필터는 UTC 날짜를 비교합니다. 정렬 방향과 관계없이 누락값과 유효하지 않은 값은 뒤로 보냅니다.

정렬·필터의 기본 입력은 표시용 `accessor`와 독립된 원본 필드입니다. 계산 컬럼에는 `sortAccessor`와 `filterAccessor`를 지정할 수 있습니다. 검색은 원본 또는 `filterAccessor`에서 반환한 문자열을 대소문자 구분 없이 검색합니다.

정렬이나 필터로 표시 순서가 바뀌면 같은 `rowKey`와 컬럼 키의 활성 셀을 유지하고 범위를 한 셀로 축소합니다. 활성 행이 결과에서 사라지면 선택을 해제합니다. 편집 중 표시 목록을 바꿀 때는 유효한 변경을 먼저 확정하고, 유효하지 않은 입력은 오류를 표시하며 폐기합니다. 편집 이벤트의 `rowIndex`는 원본 `rows` 배열 기준입니다.

`showColumnDividers`를 켜면 헤더와 본문의 컬럼 사이에 세로 구분선이 표시됩니다. 기본값은 꺼짐이며, Playground의 **Grid options**에서 바꿀 수 있습니다.

### 클립보드 복사

`enableClipboard`과 `enableSelection`을 켜고 그리드에 포커스를 둔 상태에서 Ctrl+C 또는 Cmd+C를 누릅니다. 현재 정렬·필터·검색 결과의 선택 범위를 복사합니다. 가상화로 화면에 렌더링되지 않은 선택 행도 포함합니다.

복사 형식은 헤더를 제외한 TSV입니다. 필드는 탭, 행은 CRLF로 구분합니다. 탭·줄바꿈·큰따옴표가 있는 필드는 큰따옴표로 감싸고 내부 큰따옴표를 두 번 씁니다. 컬럼의 표시값을 사용하며, 비어 있거나 표시할 수 없는 값은 빈 필드로 전달합니다. 복사한 내용을 스프레드시트에 붙여넣을 수 있습니다. 편집기, 검색 입력, 필터 입력에서는 브라우저 기본 복사를 사용합니다. 그리드 복사는 브라우저의 `copy` 이벤트를 우선 사용하고, 이벤트에 쓰기 가능한 데이터가 없으면 Clipboard API를 시도합니다. 쓰기에 실패하면 오류를 표시합니다.

### 컬럼 너비 조절과 고정

- `enableColumnResize`를 켜면 헤더 경계를 드래그하거나 해당 핸들에 포커스한 뒤 방향키로 너비를 바꿀 수 있습니다. `minWidth`, `maxWidth`, `resizable: false`로 제한합니다. 기본 드래그 최소 너비는 60px입니다.
- 변경된 너비는 컬럼 키별로 유지됩니다. 드래그 취소 시 이전 너비로 돌아갑니다. `onColumnResize`는 드래그를 놓거나 방향키로 실제 너비가 바뀔 때 호출됩니다.
- `pinned: "left"` 또는 `pinned: "right"`로 컬럼을 해당 가장자리에 배치합니다. 같은 쪽의 컬럼은 선언 순서를 유지합니다. 키보드 이동, 편집, TSV는 원래 컬럼 순서를 따릅니다. `enableColumnPinning={false}`로 고정을 끌 수 있습니다.
- 양쪽 고정 너비를 제외하고 가운데 컬럼에 48px를 확보할 수 없으면 고정을 잠시 해제합니다. 화면이 넓어지면 설정한 고정을 다시 적용합니다.

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

Phase 7에서는 대용량 상호작용 성능과 패키지 품질을 점검합니다. 클립보드 붙여넣기는 npm 첫 배포 이후 단계의 범위입니다.

[MIT](packages/react-data-grid/LICENSE)
