## 개요

라이브러리 CSS를 한 번 가져온 다음 CSS 사용자 정의 속성으로 그리드의 색상, 여백 및 포커스 표시를 변경할 수 있습니다.

```tsx
import "@advanced-data-grid/react-data-grid/styles.css";

<DataGrid className="my-grid" columns={columns} rows={rows} rowKey="id" />;
```

```css
.my-grid {
  --adg-header-background: #fef3c7;
  --adg-border-color: #a16207;
  --adg-selection-background: #f5ce74;
}
```

`className`은 스크롤 컨테이너와 그 안의 요소에 적용됩니다. 필터 패널과 오류 메시지는 컨테이너 밖에 있으므로, 전체 그리드를 테마로 꾸미려면 공통 부모 요소에 변수를 선언하세요. 라이브러리는 사용 위치에서 기본값을 적용합니다. 부모와 그리드 클래스 모두 `!important` 없이 값을 재정의할 수 있으며, 그리드 자체의 값이 상속값보다 우선합니다.

## 다크 테마와 커스텀 테마

아래 예제 중 하나를 부모 요소에 적용하세요. 예를 들어 `<div className="grid-theme-dark"><DataGrid {...props} /></div>`로 사용할 수 있습니다. Playground에서도 그리드 테마를 바꿔 볼 수 있습니다.

```css
.grid-theme-dark {
  color-scheme: dark;
  --adg-background: #111827;
  --adg-text-color: #f8fafc;
  --adg-border-color: #64748b;
  --adg-cell-border-color: #475569;
  --adg-header-background: #1e293b;
  --adg-header-text-color: #f8fafc;
  --adg-header-hover-background: #334155;
  --adg-header-hover-text-color: #f8fafc;
  --adg-row-hover-background: #25354b;
  --adg-selection-background: #1e40af;
  --adg-active-border-color: #93c5fd;
  --adg-focus-color: #93c5fd;
  --adg-editor-background: #0f172a;
  --adg-editor-text-color: #f8fafc;
  --adg-editor-border-color: #93c5fd;
  --adg-filter-panel-background: #1e293b;
  --adg-filter-input-background: #0f172a;
  --adg-filter-input-border-color: #94a3b8;
  --adg-filter-text-color: #f8fafc;
  --adg-filter-focus-color: #93c5fd;
  --adg-error-text-color: #fecaca;
  --adg-error-border-color: #fca5a5;
  --adg-error-background: #450a0a;
  --adg-resize-handle-hover-color: #93c5fd;
  --adg-pinned-background: #1e293b;
  --adg-pinned-divider-color: #94a3b8;
  --adg-empty-text-color: #cbd5e1;
}

.grid-theme-custom {
  --adg-background: #fffbeb;
  --adg-text-color: #292524;
  --adg-border-color: #a16207;
  --adg-border-radius: 4px;
  --adg-cell-border-color: #e7c899;
  --adg-header-background: #fef3c7;
  --adg-header-text-color: #713f12;
  --adg-header-hover-background: #fde68a;
  --adg-header-hover-text-color: #713f12;
  --adg-row-background: #fffdf5;
  --adg-row-hover-background: #fef3c7;
  --adg-selection-background: #f5ce74;
  --adg-active-border-color: #92400e;
  --adg-focus-color: #92400e;
  --adg-editor-background: #fffaf0;
  --adg-editor-border-color: #92400e;
  --adg-filter-panel-background: #fef3c7;
  --adg-filter-input-border-color: #a16207;
  --adg-filter-focus-color: #92400e;
  --adg-error-background: #fff1f2;
  --adg-pinned-background: #fef3c7;
  --adg-pinned-divider-color: #a16207;
}
```

## CSS 변수 참고

### 그리드

| 변수                     | 기본값                | 적용 대상                 |
| ------------------------ | --------------------- | ------------------------- |
| `--adg-font-family`      | system-ui, sans-serif | 글꼴                      |
| `--adg-font-size`        | 0.875rem              | 글자 크기                 |
| `--adg-text-color`       | #18283b               | 기본 텍스트               |
| `--adg-background`       | #fff                  | 스크롤 영역 배경          |
| `--adg-border-color`     | #d9e3ee               | 바깥 테두리와 세로 구분선 |
| `--adg-border-radius`    | 12px                  | 바깥 모서리               |
| `--adg-empty-text-color` | #52647b               | 빈 상태 메시지            |

### 헤더

| 변수                            | 기본값                      | 적용 대상                              |
| ------------------------------- | --------------------------- | -------------------------------------- |
| `--adg-header-background`       | #edf3f9                     | 헤더 배경                              |
| `--adg-header-text-color`       | #33485f                     | 헤더 텍스트                            |
| `--adg-header-border-color`     | cell-border-color           | 아래쪽 테두리                          |
| `--adg-header-padding-inline`   | 1rem; 0.25rem with controls | 가로 여백                              |
| `--adg-header-hover-background` | #d4e4fa                     | 헤더 컨트롤 호버와 활성 필터 버튼 배경 |
| `--adg-header-hover-text-color` | #17468a                     | 헤더 컨트롤 호버와 활성 필터 텍스트    |
| `--adg-sort-color`              | inherit                     | 정렬 화살표와 우선순위                 |
| `--adg-filter-icon-color`       | inherit                     | 기본 필터 아이콘                       |

### 본문과 선택

| 변수                         | 기본값      | 적용 대상                                  |
| ---------------------------- | ----------- | ------------------------------------------ |
| `--adg-row-background`       | transparent | 그리드 배경 위 셀 배경                     |
| `--adg-row-hover-background` | #f3f8fc     | 행 호버 배경                               |
| `--adg-cell-padding-inline`  | 1rem        | 셀 가로 여백                               |
| `--adg-cell-border-color`    | #e6edf4     | 셀 아래쪽 테두리                           |
| `--adg-cell-text-color`      | inherit     | 본문 셀 텍스트                             |
| `--adg-selection-background` | #dbeafe     | 범위에 포함된 모든 셀의 배경               |
| `--adg-active-border-color`  | #2455b2     | 활성 셀 안쪽 테두리                        |
| `--adg-focus-color`          | #2455b2     | 그리드·헤더·너비 조절 핸들의 키보드 포커스 |

### 편집과 오류

| 변수                        | 기본값                                                | 적용 대상            |
| --------------------------- | ----------------------------------------------------- | -------------------- |
| `--adg-editor-background`   | #fff                                                  | 편집기 배경          |
| `--adg-editor-text-color`   | inherit                                               | 편집기 텍스트        |
| `--adg-editor-border-color` | #2455b2                                               | 편집기 테두리        |
| `--adg-error-border-color`  | #b42318                                               | 잘못된 입력의 테두리 |
| `--adg-error-text-color`    | #8f2017                                               | 오류 텍스트          |
| `--adg-error-background`    | transparent for messages; input background for inputs | 오류 배경            |

### 필터

| 변수                              | 기본값                                                   | 적용 대상               |
| --------------------------------- | -------------------------------------------------------- | ----------------------- |
| `--adg-filter-panel-background`   | transparent                                              | 필터 패널 배경          |
| `--adg-filter-panel-border-color` | border-color                                             | 패널 테두리             |
| `--adg-filter-input-background`   | #fff                                                     | 필터 입력과 버튼 배경   |
| `--adg-filter-input-border-color` | #b5c5d7                                                  | 필터 입력과 버튼 테두리 |
| `--adg-filter-text-color`         | panel: text-color; controls: inherit; clear-all: #17468a | 패널과 컨트롤 텍스트    |
| `--adg-filter-focus-color`        | browser or surrounding stylesheet                        | 필터 컨트롤 포커스 색상 |

### 너비 조절과 고정

| 변수                               | 기본값                          | 적용 대상                 |
| ---------------------------------- | ------------------------------- | ------------------------- |
| `--adg-resize-handle-color`        | transparent                     | 기본 핸들 배경            |
| `--adg-resize-handle-hover-color`  | #b9d1f6                         | 핸들 호버와 포커스        |
| `--adg-resize-handle-active-color` | resize-handle-hover-color       | 누른 핸들 배경            |
| `--adg-pinned-background`          | row-background, then background | 고정 셀 배경              |
| `--adg-pinned-header-background`   | header-background               | 고정 헤더 배경            |
| `--adg-pinned-divider-color`       | #b5c5d7                         | 고정과 스크롤 컬럼의 경계 |

## 레이아웃과 접근성

가상화된 행은 40px, 고정 헤더는 44px입니다. 공개 여백 변수는 가로 방향에만 적용됩니다. 긴 텍스트는 잘릴 수 있으므로 큰 글꼴을 적용할 때 셀과 헤더 컨트롤을 함께 확인하세요. 너비 조절 핸들은 헤더 오른쪽에 기본 여백을 확보합니다. 행 높이, 위치, 오버스캔, 컬럼 너비, 고정 오프셋을 계산하는 CSS 값은 내부 구현이므로 재정의하지 마세요.

텍스트와 배경의 대비는 일반 크기에서 4.5:1 이상을 목표로 하세요. 입력 테두리와 포커스 표시도 주변 배경과 구분되도록 구성하세요. 선택 범위와 활성 셀을 구분할 수 있는지 확인하고, 색상 외에 오류 메시지도 유지하세요. 직접 만든 팔레트는 키보드와 접근성 도구로 별도 검증해야 합니다.
