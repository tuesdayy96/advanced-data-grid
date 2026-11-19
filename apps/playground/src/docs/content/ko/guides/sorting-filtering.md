`enableSorting`을 켜고 헤더를 클릭하면 오름차순 → 내림차순 → 해제 순으로 바뀝니다. Shift + 클릭으로 기존 우선순위를 유지하면서 기준을 추가하거나 변경합니다. `sortable: false`로 해당 컬럼을 정렬에서 제외하거나 `sortAccessor`로 비교할 값을 지정하세요.

`enableFiltering`을 켜고 컬럼의 `filterType`에 `text`, `number`, `date`를 지정합니다. 컬럼당 활성 조건은 하나입니다. `filterAccessor`로 사용할 값을 지정하거나 `filterable: false`로 컨트롤을 끕니다. 날짜 필터는 UTC 날짜를 비교합니다. 연산자는 [타입 설명](/docs/ko/api/events)을 참고하세요.

앱에서 관리하는 `searchQuery`를 전달하면 검색 가능한 문자열 값을 대소문자 구분 없이 검색합니다. `searchable: false`로 컬럼을 제외할 수 있습니다. 컬럼 필터와 전역 검색은 AND로 결합됩니다. `onSortChange`는 정렬 우선순위를, `onFilterChange`는 활성 필터 조건을 전달합니다. 두 콜백은 화면의 상태를 알려주며 입력 `rows` 배열은 원래 순서를 유지합니다.

[컬럼 옵션](/docs/ko/api/columns)을 참고하세요.
