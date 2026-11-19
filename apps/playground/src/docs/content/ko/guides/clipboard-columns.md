## 클립보드 복사

`enableSelection`과 `enableClipboard`를 켜고 단일 셀이나 범위를 선택한 뒤 Ctrl+C 또는 Cmd+C를 누릅니다. 현재 정렬·필터·검색 결과를 복사하며 화면 밖에 있는 선택 행도 포함합니다. 헤더를 제외한 TSV 형식으로 Excel이나 Google Sheets에 붙여넣을 수 있습니다. 입력창과 편집기는 브라우저 기본 복사를 사용합니다.

## 너비 조절

`enableColumnResize`를 켜고 헤더 경계를 끌거나 핸들에 초점을 맞춰 왼쪽 또는 오른쪽 방향키를 누릅니다. `minWidth`, `maxWidth`, `resizable: false`로 조절을 제한하세요. 드래그를 완료하거나 키보드로 실제 너비가 바뀌면 `onColumnResize`로 컬럼 키와 새 너비를 받습니다.

## 고정과 구분선

컬럼에 `pinned: "left"` 또는 `pinned: "right"`를 지정하고 `enableColumnPinning`을 켭니다. 고정 상태에서도 선택과 복사는 기존 컬럼 순서를 따릅니다. 가운데 영역에 48px를 확보할 수 없으면 화면이 넓어질 때까지 고정이 일시 해제됩니다. `showColumnDividers`로 컬럼 사이에 세로 구분선을 표시합니다.

[ColumnDef](/docs/ko/api/columns)를 참고하세요.
