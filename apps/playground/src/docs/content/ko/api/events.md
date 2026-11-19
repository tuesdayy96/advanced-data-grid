| 공개 타입          | 구조 또는 의미                                                                                                                               |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `RowKey`           | 원본 행을 식별하는 문자열 또는 숫자입니다.                                                                                                   |
| `DataGridProps<T>` | [컴포넌트 props](/docs/ko/api/data-grid)입니다.                                                                                              |
| `ColumnDef<T>`     | [컬럼 정의](/docs/ko/api/columns)입니다.                                                                                                     |
| `CellChange<T>`    | `rowKey`, 0부터 시작하는 원본 `rowIndex`, `columnKey`, `previousValue`, `value`, 원본 `row: T`를 포함합니다. 두 값의 타입은 `unknown`입니다. |
| `SortDescriptor`   | `{ columnKey: string; direction: SortDirection }`입니다.                                                                                     |
| `SortDirection`    | `"asc"` 또는 `"desc"`입니다.                                                                                                                 |
| `ColumnFilter`     | `kind`로 텍스트, 숫자, 날짜를 구분하는 유니언입니다. 각 타입은 `columnKey`, `operator`, `value`를 포함합니다.                                |
| `FilterOperator`   | 모든 필터 종류의 연산자 문자열 유니언입니다.                                                                                                 |
| `ColumnPin`        | `"left"` 또는 `"right"`입니다.                                                                                                               |

## 필터 연산자

- **텍스트**는 문자열을 받으며 `contains`, `equals`, `startsWith`, `endsWith`를 지원합니다.
- **숫자**는 숫자를 받으며 `equals`, `notEquals`, `gt`, `gte`, `lt`, `lte`를 지원합니다.
- **날짜**는 `YYYY-MM-DD` 문자열을 받으며 `equals`, `before`, `after`를 지원합니다.

정렬이나 필터를 적용한 뒤에도 `onCellChange`는 원본 기준 인덱스를 전달합니다. [편집 예제](/docs/ko/guides/editing)에서 원본을 직접 수정하지 않고 갱신하는 방법을 볼 수 있습니다. `onSortChange`와 `onFilterChange`는 활성 상태를, `onColumnResize`는 컬럼 키와 확정한 너비를 전달합니다.
