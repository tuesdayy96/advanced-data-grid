import { env } from "node:process";
import { expect, test } from "@playwright/test";

test.skip(
  env.ADG_PERF !== "1",
  "Run with ADG_PERF=1 to collect Chromium timing and heap samples.",
);

test("profiles virtual rendering and retained heap after repeated interactions", async ({
  page,
  context,
  browser,
  browserName,
}, testInfo) => {
  test.skip(
    browserName !== "chromium",
    "Chrome DevTools heap telemetry requires Chromium.",
  );
  test.setTimeout(150_000);
  const cycles = Number(env.ADG_PERF_CYCLES ?? 5);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const observer = new MutationObserver(() => {
      if (!document.querySelector('tr[data-adg-row="0"]')) return;
      observer.disconnect();
      requestAnimationFrame(() => performance.mark("adg-initial-frame"));
    });
    observer.observe(document, { subtree: true, childList: true });
  });

  const grid = page.getByRole("grid");
  const size = page.getByLabel("Dataset size");
  const pins = page.getByRole("checkbox", {
    name: /Pin columns on both sides/,
  });
  const search = page.getByRole("searchbox", { name: "Search employees" });
  const cell = (row: number, column: number) =>
    grid.locator(`tr[data-adg-row="${row}"] td[data-adg-column="${column}"]`);
  const sort = grid.getByRole("button", { name: /^Sort by Salary(,|$)/ });
  const timings: Record<string, number[]> = {};
  const heap: {
    jsBytes: number;
    nodes: number;
    listeners: number;
    documents: number;
  }[] = [];
  const cdp = await context.newCDPSession(page);
  if (env.ADG_CPU_RATE)
    await cdp.send("Emulation.setCPUThrottlingRate", {
      rate: Number(env.ADG_CPU_RATE),
    });

  async function sample(label: string, work: () => Promise<void>) {
    const before = performance.now();
    await work();
    (timings[label] ??= []).push(performance.now() - before);
  }

  for (let index = 0; index < 5; index++) {
    await page.goto("/");
    await page.waitForFunction(
      () => performance.getEntriesByName("adg-initial-frame").length > 0,
    );
    const elapsed = await page.evaluate(
      () => performance.getEntriesByName("adg-initial-frame")[0].startTime,
    );
    (timings["Navigation to first grid frame"] ??= []).push(elapsed);
  }

  async function collectHeap() {
    await cdp.send("HeapProfiler.collectGarbage");
    const used = await cdp.send("Runtime.getHeapUsage");
    const dom = await cdp.send("Memory.getDOMCounters");
    heap.push({
      jsBytes: used.usedSize,
      nodes: dom.nodes,
      listeners: dom.jsEventListeners,
      documents: dom.documents,
    });
  }

  await collectHeap();
  let maxRows = 0;
  for (let cycle = 0; cycle < cycles; cycle++) {
    await sample("Select 100,000 rows (includes preparation)", async () => {
      await size.selectOption("100000");
      await expect(grid).toHaveAttribute("aria-rowcount", "100001");
      await expect(cell(0, 0)).toHaveText("1001");
    });
    await pins.check();
    const scroll = await grid.evaluate(async (element) => {
      const table = element as HTMLTableElement;
      const scroller = table.parentElement!;
      const frame = () =>
        new Promise<number>((resolve) => requestAnimationFrame(resolve));
      let maxRows = 0;
      let maxFrames = 0;
      let previousFrame = await frame();
      const latencies: number[] = [];
      const gaps: number[] = [];
      for (let index = 0; index < 80; index++) {
        const start = performance.now();
        scroller.scrollTop = ((index * 17_309) % 99_500) * 40;
        scroller.scrollLeft = index % 2 ? 150 : 0;
        const target = Math.floor(scroller.scrollTop / 40);
        let waits = 0;
        let visible: Element | null;
        do {
          const timestamp = await frame();
          gaps.push(timestamp - previousFrame);
          previousFrame = timestamp;
          waits++;
          visible = table.querySelector(`tr[data-adg-row="${target}"]`);
        } while (!visible && waits < 10);
        if (!visible) throw new Error("No virtual row appeared at " + target);
        latencies.push(performance.now() - start);
        maxFrames = Math.max(maxFrames, waits);
        maxRows = Math.max(
          maxRows,
          table.querySelectorAll("tr[data-adg-row]").length,
        );
      }
      return { maxRows, maxFrames, latencies, gaps };
    });
    maxRows = Math.max(maxRows, scroll.maxRows);
    expect(scroll.maxRows).toBeLessThan(30);
    (timings["Combined vertical and horizontal jump to target frame"] ??=
      []).push(...scroll.latencies);
    (timings["Scroll animation frame gaps"] ??= []).push(...scroll.gaps);

    await grid.evaluate((element) => {
      element.parentElement!.scrollTop = 0;
      element.parentElement!.scrollLeft = 0;
    });
    await expect(cell(0, 1)).toBeVisible();
    await sample("Keyboard last and first cell", async () => {
      await cell(0, 1).click();
      await page.keyboard.press("Control+End");
      await expect(cell(99_999, 7)).toHaveClass(/adg-active/);
      await page.keyboard.press("Control+Home");
      await expect(cell(0, 0)).toHaveClass(/adg-active/);
    });
    await sample("Shift selection", async () => {
      await page.keyboard.press("Shift+ArrowRight");
      await expect(grid.locator('[aria-selected="true"]')).toHaveCount(2);
    });
    await sample("Open, type and cancel editor", async () => {
      await page.keyboard.press("F2");
      const edit = page.getByRole("textbox", { name: "Edit Name" });
      await edit.fill("Stability sample");
      await edit.press("Escape");
      await expect(grid).toBeFocused();
    });
    await sample("Sort salary (UI)", async () => {
      await sort.click();
      await expect(page.getByText("Sort order: Salary asc")).toBeVisible();
    });
    await sample("Add department criterion (UI)", async () => {
      await grid
        .getByRole("button", { name: "Sort by Department" })
        .click({ modifiers: ["Shift"] });
      await expect(
        page.getByText("Sort order: Salary asc, Department asc"),
      ).toBeVisible();
    });
    await sample("Apply numeric filter (UI)", async () => {
      await grid.getByRole("button", { name: "Filter Salary" }).click();
      const filter = page.getByRole("region", { name: "Filter Salary" });
      await filter.getByLabel("Condition").selectOption("gte");
      await filter.getByLabel("Value").fill("140000");
      await filter.getByRole("button", { name: "Apply" }).click();
      await expect(grid).toHaveAttribute("aria-rowcount", "2632");
    });
    await sample("Global search (includes 150 ms debounce)", async () => {
      await search.fill("design");
      await expect(grid).toHaveAttribute("aria-rowcount", "878");
    });
    await page.getByRole("button", { name: "Clear search" }).click();
    await page.getByRole("button", { name: "Clear all filters" }).click();
    await expect(grid).toHaveAttribute("aria-rowcount", "100001");
    await sample("Keyboard resize (UI)", async () => {
      await grid
        .getByRole("button", { name: "Resize Name" })
        .press("ArrowRight");
      await expect(grid.locator('th[title="Name"]')).toHaveCSS(
        "width",
        "188px",
      );
    });
    await sample("Unpin and restore (UI)", async () => {
      await pins.uncheck();
      await expect(grid.locator("th[data-pin]")).toHaveCount(0);
      await pins.check();
      await expect(grid.locator("th[data-pin]")).toHaveCount(4);
    });
    await pins.uncheck();
    await size.selectOption("100");
    await expect(grid).toHaveAttribute("aria-rowcount", "101");
    await expect(cell(0, 0)).toHaveText("1001");
    await collectHeap();
  }

  const detached = await cdp
    .send("DOM.getDetachedDomNodes")
    .catch(() => undefined);
  const detachedElements = detached?.detachedNodes.map(
    ({ treeNode }) => treeNode.nodeName,
  );
  expect(errors).toEqual([]);

  const summary = Object.fromEntries(
    Object.entries(timings).map(([label, samples]) => {
      samples.sort((a, b) => a - b);
      return [
        label,
        {
          samples: samples.length,
          medianMs: samples[Math.floor(samples.length / 2)],
          maxMs: samples.at(-1),
        },
      ];
    }),
  );
  const result = {
    browser: browser.version(),
    cpuRate: env.ADG_CPU_RATE ?? "1",
    maxRows,
    cycles,
    detachedElements,
    summary,
    heap,
  };
  console.log(JSON.stringify(result, null, 2));
  await testInfo.attach("performance-and-retained-heap", {
    body: JSON.stringify(result, null, 2),
    contentType: "application/json",
  });
});
