## Clipboard copy

Set `enableSelection` and `enableClipboard`, select one cell or a range, then press Ctrl+C or Cmd+C. Copy follows the current sorted, filtered, and searched rows, including selected rows outside the viewport. It produces TSV without headers, intended for pasting into Excel or Google Sheets. Inputs and editors retain browser-native copy.

## Resize

With `enableColumnResize`, drag a header boundary or focus its handle and press Left or Right. Use `minWidth`, `maxWidth`, and `resizable: false` to constrain resizing. `onColumnResize` receives the column key and actual new width on a completed drag or keyboard adjustment.

## Pin and divide

Set `pinned: "left"` or `pinned: "right"` on a column and keep `enableColumnPinning` enabled. Pinning preserves logical selection and copy order. If the center cannot retain 48 pixels, pinning temporarily lifts until the viewport widens. Set `showColumnDividers` to draw vertical column boundaries.

See [ColumnDef](/docs/en/api/columns).
