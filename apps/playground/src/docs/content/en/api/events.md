| Export             | Shape or meaning                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `RowKey`           | A string or number used to identify a source row.                                                                                          |
| `DataGridProps<T>` | The [component props](/docs/en/api/data-grid).                                                                                             |
| `ColumnDef<T>`     | The [column definition](/docs/en/api/columns).                                                                                             |
| `CellChange<T>`    | `rowKey`, zero-based source `rowIndex`, `columnKey`, `previousValue`, `value`, and the original `row: T`. Both value fields are `unknown`. |
| `SortDescriptor`   | `{ columnKey: string; direction: SortDirection }`.                                                                                         |
| `SortDirection`    | `"asc"` or `"desc"`.                                                                                                                       |
| `ColumnFilter`     | A union of text, number, and date filters keyed by `kind`. Each member includes `columnKey`, `operator`, and `value`.                      |
| `FilterOperator`   | The union of operator strings from all filter kinds.                                                                                       |
| `ColumnPin`        | `"left"` or `"right"`.                                                                                                                     |

## Filter operators

- **Text** with a string value uses `contains`, `equals`, `startsWith`, or `endsWith`.
- **Number** with a number value uses `equals`, `notEquals`, `gt`, `gte`, `lt`, or `lte`.
- **Date** with a `YYYY-MM-DD` value uses `equals`, `before`, or `after`.

`onCellChange` uses the original source index even after sorting or filtering. See the [editing example](/docs/en/guides/editing) for an immutable update. `onSortChange` and `onFilterChange` report active view state. `onColumnResize` reports the column key and committed width.
