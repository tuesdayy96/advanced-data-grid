- [Virtual scrolling](/docs/en/guides/virtualization) renders visible rows plus overscan. The sticky header stays visible in the scroll container.
- [Selection and keyboard navigation](/docs/en/guides/selection) supports single cells, rectangular ranges, and auto-scrolling.
- [Cell editing](/docs/en/guides/editing) supports text, numbers, dates, validation, and a change callback.
- [Sorting, filtering, and global search](/docs/en/guides/sorting-filtering) operate on the supplied rows.
- [Clipboard and columns](/docs/en/guides/clipboard-columns) covers TSV copy, resizing, pinning, and optional dividers.

## Current limits

The grid uses fixed-height rows and virtualizes rows only. Sorting, filtering, search, and TSV generation run on the client. Clipboard support covers copy; spreadsheet paste, XLSX export, and undo/redo are outside the current API. Very wide pin groups can temporarily unpin on narrow screens.
