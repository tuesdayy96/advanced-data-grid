Set `enableSelection` to activate cell selection and keyboard navigation. Click to select one cell. Drag or Shift + click extends a rectangular range from the anchor. Dragging near a vertical viewport edge auto-scrolls.

| Input                       | Action                                                       |
| --------------------------- | ------------------------------------------------------------ |
| Arrow keys / Shift + arrows | Move one cell or extend the selection from its anchor.       |
| Tab / Shift + Tab           | Move across row boundaries and leave the grid at either end. |
| Enter / Shift + Enter       | Move down or up when Enter does not start editing.           |
| Home / End                  | Move to the first or last cell in the current row.           |
| Ctrl + Home / Ctrl + End    | Move to the first or last cell in the grid.                  |

Moving to a cell outside the viewport scrolls it into view. Scrolling alone preserves selection. When sorting or filtering changes view order, the grid keeps the active row by key and collapses the range to that cell, or clears it if that row is gone.

See [cell editing](/docs/en/guides/editing) and [clipboard copy](/docs/en/guides/clipboard-columns).
