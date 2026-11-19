import { platform } from "node:process";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { pages, docPath } from "../apps/playground/src/docs/navigation";

test("navigates between the Playground and localized documentation", async ({
  page,
  browserName,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Employee directory" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "GitHub" })).toHaveAttribute(
    "href",
    "https://github.com/tuesdayy96/advanced-data-grid",
  );

  const skipLink = page.getByRole("link", { name: "Skip to content" });
  // WebKit's default keyboard preferences omit links from plain Tab navigation.
  if (browserName === "webkit") await skipLink.focus();
  else await page.keyboard.press("Tab");
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();

  await page.getByRole("link", { name: "Docs", exact: true }).press("Enter");
  await expect(
    page.getByRole("heading", { name: "Introduction" }),
  ).toBeVisible();
  await expect(page.getByRole("main")).toBeFocused();
  await page
    .getByRole("link", { name: "Installation", exact: true })
    .press("Enter");
  await expect(
    page.getByRole("heading", { name: "Installation", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "KO", exact: true }).press("Enter");
  await expect(page).toHaveURL(/\/docs\/ko\/installation$/);
  await expect(
    page.getByRole("heading", { name: "설치", exact: true }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
  await expect(page).toHaveTitle("설치 | Advanced Data Grid");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /npm에서 패키지/,
  );
  await expect(
    page.locator('link[rel="alternate"][hreflang="en"]'),
  ).toHaveAttribute(
    "href",
    "https://advanced-data-grid-ten.vercel.app/docs/en/installation",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://advanced-data-grid-ten.vercel.app/docs/ko/installation",
  );

  await page.goBack();
  await expect(page).toHaveURL(/\/docs\/en\/installation$/);
  await page.goForward();
  await page.reload();
  await expect(page).toHaveURL(/\/docs\/ko\/installation$/);
  await expect(
    page.getByRole("heading", { name: "설치", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "플레이그라운드에서 체험하기" }).click();
  await expect(
    page.getByRole("heading", { name: "직원 디렉터리" }),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "데이터 크기" }),
  ).toBeVisible();
});

test("loads every bilingual document directly and validates internal links", async ({
  page,
}) => {
  const links = new Set(
    pages.flatMap(({ slug }) => [docPath("en", slug), docPath("ko", slug)]),
  );
  for (const locale of ["en", "ko"] as const) {
    for (const doc of pages) {
      const path = docPath(locale, doc.slug);
      expect((await page.goto(path))?.ok(), path).toBe(true);
      const article = page.getByRole("article");
      await expect(
        article.getByRole("heading", { level: 1, name: doc.title[locale] }),
      ).toBeVisible();
      await expect(article).not.toContainText(
        /document is unavailable|문서를 불러올 수 없습니다|\{\{\w+\}\}/,
      );
      for (const href of await article
        .locator('a[href^="/docs/"]')
        .evaluateAll((anchors) =>
          anchors.map((link) => link.getAttribute("href")),
        )) {
        expect(
          href?.startsWith(docPath(locale)) && links.has(href),
          `${path} links to ${href}`,
        ).toBe(true);
      }
    }
  }
  await page.goto("/docs");
  await expect(page).toHaveURL(/\/docs\/en$/);
  await page.goto("/docs/ko/missing");
  await expect(
    page.getByRole("heading", { name: "페이지를 찾을 수 없습니다" }),
  ).toBeVisible();
  await page.goto("/docs/fr/installation");
  await expect(
    page.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
});

test("closes mobile navigation and keeps long content in scrollable regions", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 750 });
  await page.goto("/docs/en");
  const menu = page.getByText("Documentation menu", { exact: true });
  await menu.focus();
  await page.keyboard.press("Enter");
  const nav = page.getByRole("navigation", {
    name: "Documentation navigation",
  });
  await expect(nav.getByRole("link", { name: "Introduction" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await nav.getByRole("link", { name: "DataGrid Props" }).click();
  await expect(nav).toBeHidden();
  const region = page.getByRole("region", { name: "API table" });
  await expect(
    region.getByRole("cell", { name: "showColumnDividers" }),
  ).toBeVisible();
  expect(
    await region.evaluate((node) => node.scrollWidth > node.clientWidth),
  ).toBe(true);
  expect(
    await page
      .locator("html")
      .evaluate((node) => node.scrollWidth <= node.clientWidth),
  ).toBe(true);
});

test("highlights TSX and announces clipboard success or failure", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (source: string) => {
          if (sessionStorage.getItem("clipboard-denied"))
            throw new Error("Denied");
          sessionStorage.setItem("copied-source", source);
        },
      },
    });
  });
  await page.goto("/docs/en/quick-start");
  const code = page.locator("pre code");
  await expect(code.locator(".hljs-keyword").first()).toBeVisible();
  const button = page.getByRole("button", { name: "Copy code" });
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toHaveText("Copied.");
  expect(
    await page.evaluate(() => sessionStorage.getItem("copied-source")),
  ).toBe(await code.textContent());
  await page.evaluate(() => sessionStorage.setItem("clipboard-denied", "yes"));
  await button.click();
  await expect(page.getByRole("status")).toHaveText(
    "Could not copy. Select the code manually.",
  );
});

test("passes WCAG A/AA axe checks on documentation in both languages", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName === "firefox" && platform === "win32",
    "Windows Firefox crashes during axe evaluation in this workspace.",
  );
  for (const [path, width] of [
    ["/docs/en/quick-start", 1280],
    ["/docs/ko/api/columns", 360],
  ] as const) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(path);
    await expect(page.getByRole("article")).toBeVisible();
    if (width === 360)
      await page.getByText("문서 메뉴", { exact: true }).click();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(
      result.violations.map(({ id, nodes }) => ({
        id,
        targets: nodes.map(({ target }) => target),
      })),
      path,
    ).toEqual([]);
  }
});
