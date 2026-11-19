import type {
  ColumnDef,
  DataGridProps,
} from "@advanced-data-grid/react-data-grid";
import type { Locale } from "../i18n";

type Entry = readonly [
  type: string,
  defaultValue: string | [en: string, ko: string],
  en: string,
  ko: string,
];
type Entries<Props> = { [Key in keyof Props]-?: Entry };
type ExampleRow = { id: number };

const gridProps = {
  columns: [
    "readonly ColumnDef<T>[]",
    "",
    "Column definitions in logical order.",
    "논리 순서의 컬럼 정의입니다.",
  ],
  rows: [
    "readonly T[]",
    "",
    "Source rows in their original order.",
    "원본 순서의 데이터 행입니다.",
  ],
  rowKey: [
    "RowKey field or (row: T) => RowKey",
    "",
    "Stable, unique identity per row.",
    "행마다 고유하고 안정적인 키입니다.",
  ],
  className: [
    "string",
    "—",
    "Extra root CSS class.",
    "루트에 추가할 CSS 클래스입니다.",
  ],
  height: [
    "number | string",
    "—",
    "Scroll container height, in pixels or a CSS size.",
    "스크롤 영역 높이로, 픽셀 수 또는 CSS 크기입니다.",
  ],
  "aria-label": [
    "string",
    "Data grid",
    "Accessible grid name.",
    "그리드의 접근 가능한 이름입니다.",
  ],
  enableSelection: [
    "boolean",
    "false",
    "Enables cell selection and keyboard movement.",
    "셀 선택과 키보드 이동을 켭니다.",
  ],
  enableEditing: [
    "boolean",
    "false",
    "Enables editing when selection is active.",
    "셀 선택을 켰을 때 편집을 활성화합니다.",
  ],
  enableSorting: [
    "boolean",
    "false",
    "Enables column sorting controls.",
    "컬럼 정렬 컨트롤을 켭니다.",
  ],
  enableFiltering: [
    "boolean",
    "false",
    "Enables column filter controls.",
    "컬럼 필터 컨트롤을 켭니다.",
  ],
  showColumnDividers: [
    "boolean",
    "false",
    "Shows vertical column boundaries.",
    "컬럼 사이의 세로 구분선을 표시합니다.",
  ],
  enableClipboard: [
    "boolean",
    "false",
    "Enables TSV copy when selection is active.",
    "셀 선택을 켰을 때 TSV 복사를 활성화합니다.",
  ],
  enableColumnResize: [
    "boolean",
    "false",
    "Enables resize handles.",
    "컬럼 너비 조절 핸들을 표시합니다.",
  ],
  enableColumnPinning: [
    "boolean",
    "true",
    "Honors column pin settings when space permits.",
    "공간이 충분하면 컬럼의 고정 설정을 적용합니다.",
  ],
  searchQuery: [
    "string",
    '""',
    "Search query controlled by the app.",
    "앱에서 관리하는 전역 검색어입니다.",
  ],
  onCellChange: [
    "(change: CellChange<T>) => void",
    "—",
    "Reports a changed cell on commit.",
    "편집 확정 시 변경된 셀을 전달합니다.",
  ],
  onSortChange: [
    "(sorting: readonly SortDescriptor[]) => void",
    "—",
    "Reports sort criteria in priority order.",
    "우선순위에 따른 정렬 기준을 전달합니다.",
  ],
  onFilterChange: [
    "(filters: readonly ColumnFilter[]) => void",
    "—",
    "Reports current column filters.",
    "현재 컬럼 필터를 전달합니다.",
  ],
  onColumnResize: [
    "(columnKey: string, width: number) => void",
    "—",
    "Reports an applied width in pixels.",
    "적용된 컬럼 너비를 픽셀 단위로 전달합니다.",
  ],
} satisfies Entries<DataGridProps<ExampleRow>>;
const columnProps = {
  key: [
    "Extract<keyof T, string> | string",
    "",
    "Property name, or a custom key when paired with an accessor.",
    "행의 필드명 또는 accessor가 있는 계산 컬럼의 키입니다.",
  ],
  header: ["string", "", "Column header text.", "컬럼 헤더 텍스트입니다."],
  width: ["number", "", "Initial width in pixels.", "초기 너비(픽셀)입니다."],
  accessor: [
    "(row: T) => string | number | bigint | boolean | Date | null | undefined",
    "—",
    "Display value of a computed column; required for a custom key.",
    "계산 컬럼의 표시값이며 사용자 정의 키에 필요합니다.",
  ],
  editable: [
    "boolean | ((row: T) => boolean)",
    "false",
    "Enables editing for all rows or matching rows.",
    "모든 행 또는 조건에 맞는 행을 편집할 수 있습니다.",
  ],
  editor: [
    '"text" | "number" | "date"',
    ["Inferred", "원본 값으로 추론"],
    "Overrides the editor type.",
    "편집기 유형을 지정합니다.",
  ],
  valueGetter: [
    "(row: T) => unknown",
    "—",
    "Reads the starting value for an editor.",
    "편집기의 초기값을 읽습니다.",
  ],
  valueParser: [
    "(draft: string, row: T) => unknown",
    "—",
    "Converts input before validation.",
    "검증 전에 입력을 변환합니다.",
  ],
  validate: [
    "(value: unknown, row: T) => boolean | string",
    "—",
    "Rejects an input with false or a message.",
    "false 또는 오류 메시지를 반환해 입력을 거부합니다.",
  ],
  sortable: [
    "boolean",
    "true",
    "Allows sorting when grid-level sorting is enabled.",
    "그리드에서 정렬을 켜면 이 컬럼을 정렬할 수 있습니다.",
  ],
  sortAccessor: [
    "(row: T) => unknown",
    "—",
    "Overrides the value used to compare rows.",
    "행 정렬에 사용할 비교값을 지정합니다.",
  ],
  filterable: [
    "boolean",
    "true",
    "Allows filtering when grid-level filtering is enabled.",
    "그리드에서 필터를 켜면 이 컬럼을 필터링할 수 있습니다.",
  ],
  filterType: [
    'ColumnFilter["kind"]',
    '"text"',
    "Chooses text, number, or date criteria.",
    "텍스트, 숫자 또는 날짜 조건을 선택합니다.",
  ],
  filterAccessor: [
    "(row: T) => unknown",
    "—",
    "Overrides the value used by filters and search.",
    "필터와 검색에 사용할 값을 지정합니다.",
  ],
  searchable: [
    "boolean",
    "true",
    "Includes string values in global search.",
    "문자열 값을 전역 검색에 포함합니다.",
  ],
  minWidth: [
    "number",
    "60",
    "Minimum resize width in pixels.",
    "조절할 수 있는 최소 너비(픽셀)입니다.",
  ],
  maxWidth: [
    "number",
    "—",
    "Maximum resize width in pixels.",
    "조절할 수 있는 최대 너비(픽셀)입니다.",
  ],
  resizable: [
    "boolean",
    "true",
    "Allows resizing when grid-level resizing is enabled.",
    "그리드에서 너비 조절을 켜면 이 컬럼을 조절할 수 있습니다.",
  ],
  pinned: [
    "ColumnPin",
    "—",
    "Pins the column to the left or right edge.",
    "컬럼을 왼쪽 또는 오른쪽 가장자리에 고정합니다.",
  ],
} satisfies Entries<ColumnDef<ExampleRow>>;

function makeTable(entries: Record<string, Entry>, locale: Locale) {
  const korean = locale === "ko";
  const heading = korean
    ? "| 이름 | 타입 | 필수 | 기본값 | 설명 |"
    : "| Name | Type | Required | Default | Description |";
  const rows = Object.entries(entries).map(
    ([name, [type, initial, en, ko]]) => {
      const required =
        initial === ""
          ? korean
            ? "예"
            : "Yes"
          : name === "accessor"
            ? korean
              ? "조건부"
              : "Conditional"
            : korean
              ? "아니요"
              : "No";
      const defaultValue = Array.isArray(initial)
        ? initial[korean ? 1 : 0]
        : initial || "—";
      const safeType = type.replaceAll("|", "\\|");
      return `| \`${name}\` | \`${safeType}\` | ${required} | ${defaultValue} | ${korean ? ko : en} |`;
    },
  );
  return [heading, "| --- | --- | --- | --- | --- |", ...rows].join("\n");
}

export const gridPropsTable = (locale: Locale) => makeTable(gridProps, locale);
export const columnPropsTable = (locale: Locale) =>
  makeTable(columnProps, locale);
