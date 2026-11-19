`enableSelection`과 `enableEditing`을 켜고 컬럼의 `editable`을 `true` 또는 조건 함수로 지정합니다. 더블클릭, Enter 또는 F2로 편집을 시작합니다. Enter는 확정, Escape는 취소, Tab과 Shift + Tab은 검증 성공 시 확정하고 이동합니다. IME 조합 중 누른 키로 편집을 확정하거나 취소하지 않습니다.

`editor`는 `text`, `number` 또는 `date`를 받습니다. 숫자 입력은 비어 있지 않은 유한한 값이어야 합니다. 날짜는 `YYYY-MM-DD` 형식이며 기존 값이 `Date`이면 새 값에서 UTC 시각 부분을 유지합니다. 편집 가능한 계산 컬럼에는 `valueGetter`와 `valueParser`를 함께 사용하세요. 파서가 예외를 던지거나 `validate`가 `false`나 오류 문자열을 반환하면 입력을 거부합니다.

키보드 확정이 실패하면 오류를 표시하고 편집기에 초점을 유지합니다. 초점을 잃거나 편집 행이 렌더링 범위를 벗어나면 유효한 입력은 확정하고 유효하지 않은 입력은 폐기하면서 오류를 표시합니다. 변경된 값만 콜백으로 반환합니다. 앱에서 원본 행을 직접 수정하지 않고 새 값으로 교체하세요.

{{editing}}

[이벤트와 타입](/docs/ko/api/events)을 참고하세요.
