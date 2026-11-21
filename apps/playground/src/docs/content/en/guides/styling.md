## Overview

Import the library stylesheet once. Use CSS custom properties to adjust grid colors, spacing, and focus indicators.

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

`className` scopes overrides to the scroll container and its descendants. Put tokens on a shared ancestor to theme the filter panel and error messages too, since they sit outside that container. Defaults are CSS fallbacks at the point of use. Ancestor and grid classes work without `!important`, and a value on the grid itself takes precedence over an inherited value.

## Dark and custom themes

Apply either class to a wrapper, for example `<div className="grid-theme-dark"><DataGrid {...props} /></div>`. Try both palettes in the Playground using the grid theme selector.

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

## CSS variable reference

### Grid

| Variable                 | Default               | Applies to                                |
| ------------------------ | --------------------- | ----------------------------------------- |
| `--adg-font-family`      | system-ui, sans-serif | Font family                               |
| `--adg-font-size`        | 0.875rem              | Font size                                 |
| `--adg-text-color`       | #18283b               | Base text                                 |
| `--adg-background`       | #fff                  | Scroll container surface                  |
| `--adg-border-color`     | #d9e3ee               | Outer border and optional column dividers |
| `--adg-border-radius`    | 12px                  | Outer corners                             |
| `--adg-empty-text-color` | #52647b               | Empty-state message                       |

### Header

| Variable                        | Default                     | Applies to                                        |
| ------------------------------- | --------------------------- | ------------------------------------------------- |
| `--adg-header-background`       | #edf3f9                     | Header surface                                    |
| `--adg-header-text-color`       | #33485f                     | Header text                                       |
| `--adg-header-border-color`     | cell-border-color           | Bottom border                                     |
| `--adg-header-padding-inline`   | 1rem; 0.25rem with controls | Horizontal padding                                |
| `--adg-header-hover-background` | #d4e4fa                     | Hovered header controls and active filter button  |
| `--adg-header-hover-text-color` | #17468a                     | Text of hovered controls and active filter button |
| `--adg-sort-color`              | inherit                     | Sort arrow and priority                           |
| `--adg-filter-icon-color`       | inherit                     | Idle filter button icon                           |

### Body and selection

| Variable                     | Default     | Applies to                                              |
| ---------------------------- | ----------- | ------------------------------------------------------- |
| `--adg-row-background`       | transparent | Cell surface over the grid background                   |
| `--adg-row-hover-background` | #f3f8fc     | Hovered row cells                                       |
| `--adg-cell-padding-inline`  | 1rem        | Cell horizontal padding                                 |
| `--adg-cell-border-color`    | #e6edf4     | Cell bottom border                                      |
| `--adg-cell-text-color`      | inherit     | Body cell text                                          |
| `--adg-selection-background` | #dbeafe     | All selected cells, including ranges                    |
| `--adg-active-border-color`  | #2455b2     | Inset active cell border                                |
| `--adg-focus-color`          | #2455b2     | Keyboard outline on the grid, header and resize handles |

### Editor and errors

| Variable                    | Default                                               | Applies to           |
| --------------------------- | ----------------------------------------------------- | -------------------- |
| `--adg-editor-background`   | #fff                                                  | Editor surface       |
| `--adg-editor-text-color`   | inherit                                               | Editor text          |
| `--adg-editor-border-color` | #2455b2                                               | Editor border        |
| `--adg-error-border-color`  | #b42318                                               | Invalid input border |
| `--adg-error-text-color`    | #8f2017                                               | Error text           |
| `--adg-error-background`    | transparent for messages; input background for inputs | Error surface        |

### Filters

| Variable                          | Default                                                  | Applies to                         |
| --------------------------------- | -------------------------------------------------------- | ---------------------------------- |
| `--adg-filter-panel-background`   | transparent                                              | Filter panel surface               |
| `--adg-filter-panel-border-color` | border-color                                             | Panel outline                      |
| `--adg-filter-input-background`   | #fff                                                     | Filter inputs and buttons          |
| `--adg-filter-input-border-color` | #b5c5d7                                                  | Filter inputs and buttons border   |
| `--adg-filter-text-color`         | panel: text-color; controls: inherit; clear-all: #17468a | Panel and control text             |
| `--adg-filter-focus-color`        | browser or surrounding stylesheet                        | Filter control focus outline color |

### Resize and pinning

| Variable                           | Default                         | Applies to                                     |
| ---------------------------------- | ------------------------------- | ---------------------------------------------- |
| `--adg-resize-handle-color`        | transparent                     | Idle handle surface                            |
| `--adg-resize-handle-hover-color`  | #b9d1f6                         | Hovered or focused handle                      |
| `--adg-resize-handle-active-color` | resize-handle-hover-color       | Pressed handle                                 |
| `--adg-pinned-background`          | row-background, then background | Pinned cell surface                            |
| `--adg-pinned-header-background`   | header-background               | Pinned header surface                          |
| `--adg-pinned-divider-color`       | #b5c5d7                         | Boundary between pinned and scrollable columns |

## Layout and accessibility

Virtualized rows are 40px and the sticky header is 44px. Public padding tokens affect inline spacing only. Larger fonts can clip in fixed rows, so check cells and header controls at your target font size. Resizable headers reserve space on the right for the handle. Leave the internal row and header heights, offsets, overscan, column widths, and pinning calculations alone.

Aim for at least 4.5:1 contrast between normal-size text and its background. Verify that input borders and focus indicators stand out against adjacent colors. Check that selected ranges and the active cell remain distinguishable and keep error messages visible in addition to color cues. Test custom palettes with keyboard navigation and accessibility tools.
