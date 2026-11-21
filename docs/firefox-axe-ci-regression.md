# Firefox CI axe crash investigation

## Reproduction and evidence

Commit `df726ea` ran Playwright 1.65.1, Firefox 159.0 (revision 1572), `@axe-core/playwright` 4.14.0 and axe-core 4.14.1 in headless mode on GitHub-hosted Ubuntu 24.04 (image 20261116.133.1). Both attempts produced 18 Firefox passes and one failure in the Playground grid audit. The bilingual Docs audit, Chromium and WebKit passed. [CI attempts](https://github.com/tuesdayy96/advanced-data-grid/actions/runs/44894171937) · [Firefox retry trace and report](https://github.com/tuesdayy96/advanced-data-grid/actions/runs/44894171937/artifacts/14703690559)

The trace shows the Name filter opening, the Value input receiving focus, Enter triggering the validation alert, and the accessible-description assertion completing. The final frame evaluation in `AxeBuilder.runPartialRecursive` ended with `TargetClosedError: Page crashed` before axe returned results. The keyboard-only test passed in both attempts. The job's exit code 1 came from Playwright. The runner logs and artifact contain no Firefox process exit status, native stack or minidump. They also lack memory measurements and kernel OOM records for the crash.

On Windows 25H2, an isolated copy of the same grid test with its former Windows skip removed reproduced the crash three times out of three on revision 1572. In the `DEBUG=pw:browser` logs, the Firefox parent process exited normally during teardown (exit code 0, no signal). There were graphics and browser-service warnings and no captured minidump or content-process exit code. This shows the full suite's prior tests and the Ubuntu runner are unnecessary to reproduce the page crash.

## Root cause and change

Mozilla identified a Firefox DOM bug in ARIA element reflection across JavaScript worlds. Playwright reproduced the matching axe regression on Firefox revision 1572, including a reduced reproduction that reads the reflected property without axe. Playwright main incorporated the browser fix starting with revision 1575. [Mozilla bug 2090055](https://bugzilla.mozilla.org/show_bug.cgi?id=2090055) · [Playwright axe regression](https://github.com/microsoft/playwright/issues/44135) · [Firefox revision 1575 update](https://github.com/microsoft/playwright/pull/43982)

The repository's crash matches the affected browser build, cross-engine behavior and ARIA usage. The Playground contains a section named with `aria-labelledby`; opening the filter and displaying its validation error was the observed trigger scenario. A repository-native stack is unavailable, so the exact element and property access that terminated its content process remain inferred from the upstream diagnosis. The keyboard assertions passed before the crash, and axe produced no violation result in the failing run. The Windows reproduction also weighs against Ubuntu resource pressure or test order as a necessary condition. Resource telemetry would still be needed to assess runner memory at the time of failure.

The stable Playwright version available during the investigation was 1.65.1. Pin the dev dependency to 1.64.1, which bundles Firefox 157.0 (revision 1555), and use its matching Chromium and WebKit binaries. Remove the Windows Firefox skips for the grid and Docs audits after verifying them with this version. The grid test still audits the full document with the open invalid filter, the same four WCAG tags and the zero-violations assertion. The docs audit still checks both languages. App code, npm package version and public API stay at the existing 0.1.1 baseline.

## Verification

| Environment                 | Playwright | Check                           | Result                                             |
| --------------------------- | ---------- | ------------------------------- | -------------------------------------------------- |
| Ubuntu 24.04 GitHub Actions | 1.65.1     | Firefox full E2E, two attempts  | 18 passed and one page crash per attempt           |
| Windows 25H2                | 1.65.1     | Isolated Firefox grid axe audit | 3 crashes in 3 runs                                |
| Windows 25H2                | 1.64.1     | Isolated Firefox grid axe audit | 30 passed                                          |
| Windows 25H2                | 1.64.1     | Full Firefox E2E, two repeats   | 38 passed, including both axe tests in each repeat |

Chromium and WebKit passed all 19 tests each on Windows. The frozen install, TypeScript, ESLint, Prettier, all 112 Vitest tests, and the library and Playground builds also passed.

Repeat the checks from the repository root.

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium firefox webkit
pnpm test:e2e e2e/grid.spec.ts --project=firefox -g 'passes WCAG' --repeat-each=30 --retries=0
pnpm test:e2e --project=firefox --repeat-each=2 --retries=0
pnpm test:e2e --project=chromium --project=webkit --retries=0
```

On Ubuntu 24.04, install the browsers with `--with-deps` as CI does. If the crash recurs, rerun the focused command with `DEBUG=pw:browser` and `--trace=on`. Record browser stderr, renderer termination or crash dumps if present, and runner memory and kernel OOM telemetry around the failing test.

The post-change GitHub Actions run needs a separately authorized push. Revisit the pin when a stable release ships the Playwright Firefox browser fix, and run the focused repetitions and complete browser matrix before upgrading.
