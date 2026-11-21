import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const grid = (page: Page) =>
  page.getByRole("grid", { name: "Employee records" });
const row = (page: Page, index: number) =>
  grid(page).locator(`tr[data-adg-row="${index}"]`);
const cell = (page: Page, index: number, column: number) =>
  row(page, index).locator(`td[data-adg-column="${column}"]`);
const sort = (page: Page, header: string) =>
  grid(page).getByRole("button", {
    name: new RegExp(`^Sort by ${header}(,|$)`),
  });
const filter = (page: Page, header: string) =>
  grid(page).getByRole("button", {
    name: new RegExp(`^Filter ${header}(,|$)`),
  });
const search = (page: Page) =>
  page.getByRole("searchbox", { name: "Search employees" });

async function dataset(page: Page, count: number) {
  await page.getByLabel("Dataset size").selectOption(String(count));
  await expect(grid(page)).toHaveAttribute("aria-rowcount", String(count + 1));
  await expect(cell(page, 0, 0)).toBeVisible();
}

async function applyFilter(
  page: Page,
  header: string,
  condition: string,
  value: string,
) {
  await filter(page, header).click();
  const panel = page.getByRole("region", { name: `Filter ${header}` });
  await panel.getByLabel("Condition").selectOption(condition);
  await panel.getByLabel("Value").fill(value);
  await panel.getByRole("button", { name: "Apply" }).click();
  await expect(panel).toHaveCount(0);
}

async function expectActive(page: Page, index: number, column: number) {
  const target = cell(page, index, column);
  await expect(target).toHaveClass(/adg-active/);
  const id = await target.getAttribute("id");
  expect(id).toBeTruthy();
  await expect(grid(page)).toHaveAttribute("aria-activedescendant", id ?? "");
}

async function copyEvent(page: Page) {
  await page.evaluate(() => {
    document.documentElement.removeAttribute("data-e2e-copy");
    window.addEventListener(
      "copy",
      (event) => {
        document.documentElement.setAttribute(
          "data-e2e-copy",
          event.clipboardData?.getData("text/plain") ?? "",
        );
      },
      { once: true },
    );
  });
  await page.keyboard.press("Control+c");
  await expect(page.locator("html")).toHaveAttribute("data-e2e-copy", /.+/);
  return (await page.locator("html").getAttribute("data-e2e-copy"))?.replaceAll(
    "\r\n",
    "\n",
  );
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(cell(page, 0, 0)).toHaveText("1001");
});

test("renders accessible data and restores the empty search view", async ({
  page,
}) => {
  await expect(grid(page).getByRole("columnheader")).toHaveCount(8);
  await expect(cell(page, 0, 1)).toHaveText("Amara Nguyen");
  await search(page).fill("no-matching-employee");
  await expect(grid(page)).toHaveAttribute("aria-rowcount", "1");
  await expect(
    page.getByText("No rows match the current filters or search."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(cell(page, 0, 0)).toHaveText("1001");
});

test("keeps the 100,000-row virtual window bounded while jumping and resizing", async ({
  page,
}) => {
  await dataset(page, 100_000);
  for (const index of [50_000, 99_999, 12_345, 0]) {
    await grid(page).evaluate((table, index) => {
      table.parentElement!.scrollTop = index * 40;
    }, index);
    await expect(cell(page, index, 0)).toHaveText(String(index + 1001));
    expect(
      await grid(page).locator("tbody tr[data-adg-row]").count(),
    ).toBeLessThan(30);
  }
  expect(
    await grid(page).evaluate((table) => table.parentElement!.scrollHeight),
  ).toBe(4_000_044);
  await page.setViewportSize({ width: 820, height: 600 });
  await expect(cell(page, 0, 0)).toHaveText("1001");
  expect(
    await grid(page).locator("tbody tr[data-adg-row]").count(),
  ).toBeLessThan(20);
});

test("supports keyboard selection, offscreen movement and Tab exit", async ({
  page,
}) => {
  await search(page).focus();
  await page.keyboard.press("Tab");
  await expect(grid(page)).toBeFocused();
  await expectActive(page, 0, 0);
  await page.keyboard.press("Shift+ArrowRight");
  await expect(grid(page).locator('[aria-selected="true"]')).toHaveCount(2);
  await page.keyboard.press("ArrowDown");
  await expectActive(page, 1, 1);
  await page.keyboard.press("Home");
  await expectActive(page, 1, 0);
  await page.keyboard.press("Control+End");
  await expectActive(page, 99, 7);
  await page.evaluate(() => {
    const button = document.createElement("button");
    button.textContent = "After grid";
    document.querySelector('[role="grid"]')?.parentElement?.after(button);
  });
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "After grid" })).toBeFocused();
  await grid(page).focus();
  await page.keyboard.press("Control+Home");
  await expectActive(page, 0, 0);
  await grid(page).evaluate((table) => {
    table.parentElement!.scrollTop = 2400;
  });
  await expect(grid(page)).not.toHaveAttribute("aria-activedescendant", /.+/);
  await grid(page).evaluate((table) => {
    table.parentElement!.scrollTop = 0;
  });
  await expectActive(page, 0, 0);
});

test("edits text, numeric and date values with validation, cancellation and focus restoration", async ({
  page,
}) => {
  await cell(page, 0, 1).click();
  await page.keyboard.press("F2");
  const editor = grid(page).getByRole("textbox", { name: "Edit Name" });
  await expect(editor).toBeFocused();
  await editor.fill("");
  await editor.press("Enter");
  await expect(editor).toHaveAttribute("aria-invalid", "true");
  await expect(editor).toHaveAccessibleDescription("Enter a non-empty value.");
  await editor.fill("QA Name");
  await editor.press("Enter");
  await expect(cell(page, 0, 1)).toHaveText("QA Name");
  await expect(grid(page)).toBeFocused();
  await page.keyboard.press("F2");
  await editor.fill("Cancelled");
  await editor.press("Escape");
  await expect(cell(page, 0, 1)).toHaveText("QA Name");

  await page.keyboard.press("End");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("F2");
  const salary = grid(page).getByRole("textbox", { name: "Edit Salary" });
  await expect(salary).toHaveValue("48000");
  await salary.fill("62000.5");
  await salary.press("Tab");
  await expect(cell(page, 0, 6)).toHaveText("62,000.5");
  await expectActive(page, 0, 7);
  await page.keyboard.press("F2");
  const date = grid(page).getByLabel("Edit Created at");
  await date.fill("2028-02-29");
  await date.press("Enter");
  await expect(cell(page, 0, 7)).toHaveText("2028-02-29");
});

test("reopens the same editor after commit and cancellation without clicking again", async ({
  page,
}) => {
  const name = cell(page, 0, 1);
  const editor = grid(page).getByRole("textbox", { name: "Edit Name" });
  await name.click();
  await page.keyboard.press("F2");
  await expect(editor).toBeFocused();
  await editor.fill("Updated name");
  await page.keyboard.press("Enter");
  await expect(name).toHaveText("Updated name");
  await expect(grid(page)).toBeFocused();
  await expectActive(page, 0, 1);

  await page.keyboard.press("F2");
  await expect(editor).toBeFocused();
  await expect(editor).toHaveValue("Updated name");
  await editor.fill("Cancelled name");
  await page.keyboard.press("Escape");
  await expect(grid(page)).toBeFocused();
  await expect(name).toHaveText("Updated name");
  await expectActive(page, 0, 1);

  await page.keyboard.press("F2");
  await expect(editor).toBeFocused();
  await expect(editor).toHaveValue("Updated name");
});

for (const [key, from, to, nextEditor] of [
  ["ArrowRight", 3, 4, "Role"],
  ["Shift+Tab", 4, 3, "Department"],
] as const) {
  test(`opens the next editor after commit and ${key}`, async ({ page }) => {
    const source = cell(page, 0, from);
    await source.click();
    await page.keyboard.press("Enter");
    const editor = grid(page).getByRole("textbox", { name: /^Edit / });
    await expect(editor).toBeFocused();
    await editor.fill("Updated value");
    await page.keyboard.press("Enter");
    await expect(source).toHaveText("Updated value");
    await expect(grid(page)).toBeFocused();

    await page.keyboard.press(key);
    await expectActive(page, 0, to);
    await page.keyboard.press("F2");
    await expect(
      grid(page).getByRole("textbox", { name: `Edit ${nextEditor}` }),
    ).toBeFocused();
    await expect(source).toHaveText("Updated value");
  });
}

test("sorts by multiple criteria and edits the correct filtered row", async ({
  page,
}) => {
  await sort(page, "Department").click();
  await sort(page, "Salary").click({ modifiers: ["Shift"] });
  await sort(page, "Salary").click({ modifiers: ["Shift"] });
  await expect(
    page.getByText("Sort order: Department asc, Salary desc"),
  ).toBeVisible();
  await expect(cell(page, 0, 3)).toHaveText("Design");
  await applyFilter(page, "Salary", "gte", "100000");
  await search(page).fill("design");
  await expect(grid(page)).toHaveAttribute("aria-rowcount", "8");
  await expect(cell(page, 0, 3)).toHaveText("Design");
  await expect(
    page.getByText("Active filters: Salary gte 100000"),
  ).toBeVisible();
  const id = await cell(page, 0, 0).textContent();
  await cell(page, 0, 1).dblclick();
  const input = grid(page).getByRole("textbox", { name: "Edit Name" });
  await input.fill("Sorted QA");
  await input.press("Enter");
  await expect(
    page.getByText(new RegExp(`Row ${id} / name: .* to Sorted QA`)),
  ).toBeVisible();
});

test("copies sorted TSV through a native shortcut", async ({
  page,
  context,
  browserName,
}) => {
  await sort(page, "ID").click();
  await sort(page, "ID").click();
  await cell(page, 0, 0).click();
  await page.keyboard.press("Shift+ArrowDown");
  expect(await copyEvent(page)).toBe("1100\n1099");
  if (browserName === "chromium") {
    await context.grantPermissions(["clipboard-read"], {
      origin: new URL(page.url()).origin,
    });
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard.replaceAll("\r\n", "\n")).toBe("1100\n1099");
  }
});

test("resizes by pointer and keyboard without triggering sort", async ({
  page,
}) => {
  const handle = grid(page).getByRole("button", { name: "Resize Name" });
  const col = grid(page).locator('th[title="Name"]');
  await handle.scrollIntoViewIfNeeded();
  const point = await handle.boundingBox();
  expect(point).not.toBeNull();
  if (!point) return;
  const x = point.x + point.width / 2;
  const y = point.y + point.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 200, y);
  await expect(col).toHaveCSS("width", "320px");
  await page.mouse.up();
  await handle.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(col).toHaveCSS("width", "312px");
  await expect(grid(page).locator("[aria-sort]")).toHaveCount(0);
});

test("keeps both pinned sides aligned with the sticky header and a pinned editor", async ({
  page,
}) => {
  await page.setViewportSize({ width: 930, height: 1120 });
  await page
    .getByRole("checkbox", { name: /Pin columns on both sides/ })
    .check();
  await grid(page).evaluate((table) => {
    table.parentElement!.scrollLeft = 180;
    table.parentElement!.scrollTop = 400;
  });
  await expect(cell(page, 11, 0)).toBeVisible();
  const geometry = await grid(page).evaluate((element) => {
    const table = element as HTMLTableElement;
    const root = table.parentElement!;
    const bounds = root.getBoundingClientRect();
    const headers = [...table.tHead!.rows[0].cells];
    const cells = [...table.querySelectorAll('tr[data-adg-row="11"] td')];
    const left =
      headers[0].getBoundingClientRect().left - bounds.left - root.clientLeft;
    const right =
      headers.at(-1)!.getBoundingClientRect().right -
      bounds.left -
      root.clientLeft -
      root.clientWidth;
    const top =
      headers[0].getBoundingClientRect().top - bounds.top - root.clientTop;
    const alignment = Math.max(
      ...headers.map((header, index) =>
        Math.abs(
          header.getBoundingClientRect().left -
            cells[index].getBoundingClientRect().left,
        ),
      ),
    );
    return [left, right, top, alignment];
  });
  expect(geometry.every((value) => Math.abs(value) < 1.1)).toBe(true);
  await cell(page, 11, 1).dblclick();
  await grid(page).getByRole("textbox", { name: "Edit Name" }).press("Escape");
  await expectActive(page, 11, 1);
  await page.setViewportSize({ width: 470, height: 950 });
  await expect(grid(page).locator("th[data-pin]")).toHaveCount(0);
});

test("combines 100,000 rows, filtering, sorting, selection, editing, copying and pins", async ({
  page,
}) => {
  await page
    .getByRole("checkbox", { name: /Pin columns on both sides/ })
    .check();
  await dataset(page, 100_000);
  await sort(page, "Salary").click();
  await sort(page, "Salary").click();
  await applyFilter(page, "Salary", "gte", "140000");
  await expect(grid(page)).toHaveAttribute("aria-rowcount", "2632");
  await cell(page, 0, 1).click();
  await page.keyboard.press("F2");
  await grid(page).getByRole("textbox", { name: "Edit Name" }).fill("Large QA");
  await page.keyboard.press("Enter");
  await expect(cell(page, 0, 1)).toHaveText("Large QA");
  await expect(grid(page)).toBeFocused();
  await expectActive(page, 0, 1);
  expect(await copyEvent(page)).toBe("Large QA");
  const handle = grid(page).getByRole("button", { name: "Resize Name" });
  await handle.focus();
  await page.keyboard.press("ArrowRight");
  await expect(grid(page).locator('th[title="Name"]')).toHaveCSS(
    "width",
    "188px",
  );
  await grid(page).focus();
  await page.keyboard.press("Control+End");
  await expectActive(page, 2630, 7);
  expect(
    await grid(page).locator("tbody tr[data-adg-row]").count(),
  ).toBeLessThan(30);
});

async function openInvalidFilter(page: Page) {
  await filter(page, "Name").focus();
  await page.keyboard.press("Enter");
  const panel = page.getByRole("region", { name: "Filter Name" });
  await expect(panel.getByLabel("Value")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(panel.getByRole("alert")).toBeVisible();
  await expect(panel.getByLabel("Value")).toHaveAccessibleDescription(
    "Enter a valid text filter value.",
  );
}

test("uses keyboard-only filter controls and restores trigger focus", async ({
  page,
}) => {
  await openInvalidFilter(page);
  await page.keyboard.press("Escape");
  await expect(filter(page, "Name")).toBeFocused();
});

test("passes WCAG A/AA axe checks with an open filter and validation error", async ({
  page,
}) => {
  await openInvalidFilter(page);
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(
    result.violations.map(({ id, nodes }) => ({
      id,
      targets: nodes.map(({ target }) => target),
    })),
  ).toEqual([]);
});

for (const [theme, colors] of [
  [
    "default",
    [
      "#edf3f9",
      "#d9e3ee",
      "#18283b",
      "#fff",
      "#dbeafe",
      "#2455b2",
      "#fff",
      "transparent",
      "transparent",
    ],
  ],
  [
    "dark",
    [
      "#1e293b",
      "#64748b",
      "#f8fafc",
      "#1e293b",
      "#1e40af",
      "#93c5fd",
      "#0f172a",
      "#1e293b",
      "#450a0a",
    ],
  ],
  [
    "custom",
    [
      "#fef3c7",
      "#a16207",
      "#292524",
      "#fef3c7",
      "#f5ce74",
      "#92400e",
      "#fffaf0",
      "#fef3c7",
      "#fff1f2",
    ],
  ],
] as const) {
  test(`${theme} theme styles the grid and passes the open-filter audit`, async ({
    page,
  }) => {
    const expected = colors.map((color) => {
      if (color === "transparent") return "rgba(0, 0, 0, 0)";
      const digits = color.slice(1);
      const hex = digits.length === 3 ? digits.replace(/./g, "$&$&") : digits;
      return `rgb(${[0, 2, 4].map((index) => parseInt(hex.slice(index, index + 2), 16)).join(", ")})`;
    });
    const [
      header,
      border,
      text,
      pinned,
      selection,
      focus,
      editor,
      panel,
      error,
    ] = expected;
    await page.getByLabel("Grid theme").selectOption(theme);
    await page
      .getByRole("checkbox", { name: /Pin columns on both sides/ })
      .check();
    const root = page.locator(".adg-root");
    await expect(grid(page).locator("thead th").first()).toHaveCSS(
      "background-color",
      header,
    );
    await expect(root).toHaveCSS("border-top-color", border);
    await expect(cell(page, 0, 1)).toHaveCSS("color", text);
    await expect(cell(page, 0, 0)).toHaveCSS("background-color", pinned);
    await cell(page, 0, 1).click();
    await expect(cell(page, 0, 1)).toHaveCSS("background-color", selection);
    await expect(cell(page, 0, 1)).toHaveCSS(
      "box-shadow",
      new RegExp(focus.replaceAll(/[()]/g, "\\$&")),
    );
    await page.keyboard.press("F2");
    const editorInput = page.locator(".adg-editor");
    await expect(editorInput).toHaveCSS("background-color", editor);
    await expect(editorInput).toHaveCSS("color", text);
    await editorInput.fill("Themed employee");
    await editorInput.press("Enter");
    await expect(cell(page, 0, 1)).toHaveText("Themed employee");
    await openInvalidFilter(page);
    const filterPanel = page.getByRole("region", { name: "Filter Name" });
    await expect(filterPanel).toHaveCSS("background-color", panel);
    await expect(filterPanel.getByRole("alert")).toHaveCSS(
      "background-color",
      error,
    );
    if (theme !== "default") {
      await expect(filterPanel.getByLabel("Value")).toHaveCSS(
        "outline-color",
        focus,
      );
    }
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(
      result.violations.map(({ id, nodes }) => ({
        id,
        targets: nodes.map(({ target }) => target),
      })),
    ).toEqual([]);
  });
}

test("switches themes without losing grid state or fixed row geometry", async ({
  page,
}) => {
  const theme = page.getByLabel("Grid theme");
  await sort(page, "Name").click();
  await applyFilter(page, "Name", "contains", "a");
  const header = grid(page).locator('th[title="Name"]');
  const resize = header.locator(".adg-resize-handle");
  await resize.focus();
  await page.keyboard.press("ArrowRight");
  const width = await header.evaluate(
    (element) => element.getBoundingClientRect().width,
  );
  await cell(page, 0, 1).click();
  const table = await grid(page).elementHandle();
  await theme.selectOption("dark");
  expect(await table?.evaluate((element) => element.isConnected)).toBe(true);
  await expect(header).toHaveAttribute("aria-sort", "ascending");
  await expect(filter(page, "Name")).toHaveAttribute("data-filtered", "true");
  await expectActive(page, 0, 1);
  await expect(cell(page, 0, 1)).toHaveAttribute("aria-selected", "true");
  expect(
    await header.evaluate((element) => element.getBoundingClientRect().width),
  ).toBe(width);
  await page.addStyleTag({
    content:
      ".my-grid { --adg-font-size: 2rem; --adg-cell-padding-inline: 0.25rem; --adg-header-background: #118899; }",
  });
  await page
    .locator(".adg-root")
    .evaluate((element) => element.classList.add("my-grid"));
  await expect(header).toHaveCSS("background-color", "rgb(17, 136, 153)");
  await expect(cell(page, 0, 1)).toHaveCSS("padding-left", "4px");
  await expect(cell(page, 0, 1)).toHaveCSS("height", "40px");
  await expect(header).toHaveCSS("height", "44px");
  await grid(page).focus();
  await page.keyboard.press("F2");
  await expect(page.locator(".adg-editor")).toBeFocused();
  await page.keyboard.press("Escape");
});
