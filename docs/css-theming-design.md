# CSS theming design

## Motivation and existing style architecture

The package ships a standalone stylesheet through `@advanced-data-grid/react-data-grid/styles.css`. The existing React `className` applies to the scroll container. The table lives inside that container, while the filter controls and error messages are its siblings. This change keeps those elements and selectors in place and uses CSS to style them.

## Public custom properties and cascade

The [English reference](../apps/playground/src/docs/content/en/guides/styling.md) and [Korean reference](../apps/playground/src/docs/content/ko/guides/styling.md) list the public tokens and their defaults, with runnable dark and custom palettes. Typography, surfaces, borders, horizontal padding, selection, focus, editing, filters, resize handles, and pinned columns each have tokens. For example, `--adg-pinned-header-background` falls back to `--adg-header-background`, which defaults to `#edf3f9`.

Defaults live in `var()` fallbacks where each property is consumed. A class on the scroll container can override its subtree even when the package stylesheet comes later. A common ancestor passes the same values to the grid, the filter panel and the errors. Values declared on the grid take precedence over inherited values for that subtree. Selection retains its priority over the row hover and pinned surfaces.

## Layout and examples

Virtualized rows remain 40px high and the sticky header remains 44px high. Public padding only affects the inline axis. Header controls are constrained to the existing fixed box and cells retain overflow clipping and ellipsis. Large fonts or padding can clip content in narrow columns. The row and header height variables supplied internally by the component are implementation details alongside the virtual scroll and pinning offsets.

Use opaque pinned backgrounds when ordinary row surfaces are translucent so scrolled cells stay hidden under the pinned columns.

The Playground changes the wrapper class to show Default, Dark, or Custom. Its grid component identity and React props are independent of this palette choice. Focusing the theme selector during editing follows the grid's existing commit-on-blur behavior.

## Accessibility and browser tests

The regression tests check computed styles for the default and custom palettes, including selection, focus, editors, the open filter, the validation alert, and pinned cells. Axe runs the same WCAG A/AA tag set against each complete themed Playground with a visible filter error. The tests also check that switching palettes keeps selection, sorting, filtering and resized widths, and that a class override leaves virtual row and header geometry intact. The existing keyboard, clipboard, search, pinning, virtualization and editing tests remain in the browser matrix.

Custom palettes require their own review of text contrast, focus, controls, selection, and errors. Axe and computed-style assertions cover selected examples. Native macOS Safari and manual assistive technology testing require separate environments.

Across the three example palettes, calculated contrast was at least 7.79:1 for header text, 8.34:1 for selected text, 14.58:1 for editor text, 8.01:1 for error text, and 4.71:1 for the active-cell indicator against the selected cell. These measurements cover those color pairs.

On Windows, Playwright 1.64.1 passed 92 tests across Chromium, Firefox, WebKit, and the installed Edge channel (23 per browser). Vitest passed all 112 tests. Frozen install, type checking, lint, formatting, and both production builds also passed.

## Package and release preparation

The CSS export, stylesheet side effects, and React 18/19 peer ranges use the existing package configuration. Separate Vite production builds installed the npm tarball with React 18.3.1 and 19.3.1. Chromium verified that both builds retained the stylesheet imported via its public subpath, applied grid and wrapper overrides, and themed the open filter panel. The consumer stylesheet was imported before the package stylesheet.

Compared with npm's published 0.1.1 tarball, the JavaScript entry (53,753 bytes) and its declarations (2,798 bytes) are byte-for-byte identical. The standalone CSS grew from 5,115 to 8,010 uncompressed bytes.

The patch Changeset describes the backwards-compatible styling additions. The package remains at 0.1.1 until the Version PR. Remote CI, Version PR generation and Trusted Publishing are release verification steps after the feature branch is approved for push.
