Enable `enableSorting` and click a sortable header to cycle ascending → descending → cleared. Shift + click adds or updates a criterion while preserving priority. Set `sortable: false` on a column to hide its sort control; supply `sortAccessor` to sort by a custom value.

Enable `enableFiltering` and select `text`, `number`, or `date` as the column's `filterType`. Each column can have one active condition. Use `filterAccessor` for a custom value, or `filterable: false` to disable the control. Date filtering compares UTC dates. The [types reference](/docs/en/api/events) lists the operators.

Pass `searchQuery` from your own input for case-insensitive search over searchable string values. Set `searchable: false` to exclude a column. Filters and search combine with AND. `onSortChange` reports ordered criteria; `onFilterChange` reports active conditions. Both callbacks describe view state. The input `rows` array stays in source order.

See [column options](/docs/en/api/columns).
