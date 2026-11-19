Enable `enableSelection` and `enableEditing` and set the column's `editable` to `true` or a predicate. Start with double-click, Enter, or F2. Enter commits; Escape cancels; Tab and Shift + Tab commit and move if validation succeeds. The editor does not treat IME composition keystrokes as commit or cancel.

`editor` can be `text`, `number`, or `date`. Numbers must be finite and nonempty. Date input uses `YYYY-MM-DD`; existing `Date` values retain their UTC time portion in the new value. Use `valueGetter` and `valueParser` together for editable computed columns. A parser can throw; `validate` can return `false` or an error string.

A failed keyboard commit shows a validation error and keeps focus in the editor. On blur or when the edited row leaves the rendered range, valid input commits; invalid input is discarded and the error is displayed. The callback runs only for a changed value. Apply the event to your own rows immutably.

{{editing}}

See [events and types](/docs/en/api/events).
