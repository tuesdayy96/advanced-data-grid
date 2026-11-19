import type { GridFlags } from "./demo/gridFlags";

export type Locale = "en" | "ko";
export const playgroundPath = (locale: Locale) =>
  locale === "ko" ? "/?lang=ko" : "/";
const en = {
  title: "Employee directory",
  intro:
    "Browse up to 100,000 sample employees. The grid renders the visible rows and adds a small buffer for scrolling.",
  records: "Employee records",
  size: "Dataset size",
  options: "Grid options",
  search: "Search employees",
  clear: "Clear search",
  selection:
    "Click a cell or press Tab to focus the grid. Drag to select a range, or use the arrow keys to move and Shift + arrows to extend the selection. Use Ctrl + Home or Ctrl + End to jump to the first or last cell.",
  editing:
    "Double-click an editable cell or press Enter or F2 to edit. Press Escape to cancel.",
  clipboard:
    "Select cells and press Ctrl+C or Cmd+C. Paste the copied text into a spreadsheet.",
  resize: "Drag a header's resize handle or focus it and press Left or Right.",
  pin: "ID and Name are pinned left. Status and Created at are pinned right when the grid is wide enough.",
  rows: "rows",
  total: "total rows",
  virtual: "Virtual scrolling enabled",
  generation: "Data generation",
  preparing: "Preparing",
  sort: "Sort order",
  filter: "Active filters",
  row: "Row",
  to: "to",
  empty: "Empty",
  metrics: {
    matching: "Matching rows",
    rendered: "Rendered rows",
    visible: "Visible rows",
    viewport: "Data viewport",
    rowHeight: "Row height",
  },
};
const ko = {
  title: "직원 디렉터리",
  intro:
    "최대 100,000개의 샘플 직원 데이터에서 화면에 보이는 행과 스크롤에 필요한 주변 행을 렌더링합니다.",
  records: "직원 목록",
  size: "데이터 크기",
  options: "그리드 옵션",
  search: "직원 검색",
  clear: "검색 지우기",
  selection:
    "셀을 클릭하거나 Tab으로 그리드에 초점을 맞추세요. 드래그로 범위를 선택하거나 방향키로 이동하고 Shift + 방향키로 선택을 확장하세요. Ctrl + Home 또는 Ctrl + End로 첫 셀이나 마지막 셀로 이동합니다.",
  editing:
    "편집 가능한 셀을 더블클릭하거나 Enter 또는 F2를 누르세요. Escape로 취소합니다.",
  clipboard:
    "셀을 선택하고 Ctrl+C 또는 Cmd+C를 누르세요. 복사한 내용을 스프레드시트에 붙여넣을 수 있습니다.",
  resize:
    "헤더의 크기 조절 핸들을 끌거나 초점을 맞춰 왼쪽 또는 오른쪽 방향키를 누르세요.",
  pin: "ID와 이름은 왼쪽에 고정됩니다. 그리드가 충분히 넓으면 상태와 생성일은 오른쪽에 고정됩니다.",
  rows: "행",
  total: "개 전체 행",
  virtual: "가상 스크롤 활성화",
  generation: "데이터 생성",
  preparing: "준비 중",
  sort: "정렬 순서",
  filter: "활성 필터",
  row: "행",
  to: "→",
  empty: "비어 있음",
  metrics: {
    matching: "일치하는 행",
    rendered: "렌더링된 행",
    visible: "화면에 보이는 행",
    viewport: "데이터 표시 영역",
    rowHeight: "행 높이",
  },
} satisfies typeof en;
export const playgroundText = { en, ko };
export const koreanFlags = {
  enableSelection: "셀 선택 및 키보드 탐색",
  enableEditing: "셀 편집 (선택 기능 필요)",
  enableSorting: "컬럼 정렬",
  enableFiltering: "컬럼 필터",
  showColumnDividers: "컬럼 구분선",
  enableClipboard: "선택한 셀 복사",
  enableColumnResize: "컬럼 너비 조절",
  enableColumnPinning: "컬럼 양쪽 고정",
} satisfies Record<keyof GridFlags, string>;
