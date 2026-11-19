import type { Locale } from "../i18n";
import { columnPropsTable, gridPropsTable } from "./apiTables";
import editing from "./examples/editing.tsx?raw";
import quickStart from "./examples/quickStart.tsx?raw";
import type { DocPage } from "./navigation";

const markdown = import.meta.glob<string>("./content/**/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
});

const tsx = (code: string) => `\`\`\`tsx\n${code.trimEnd()}\n\`\`\``;

export function getMarkdown(locale: Locale, slug: DocPage["slug"]) {
  const source = markdown[`./content/${locale}/${slug || "index"}.md`];
  if (!source) {
    return locale === "ko"
      ? "이 언어의 문서를 불러올 수 없습니다."
      : "This version of the document is unavailable.";
  }

  const replacements: Record<string, () => string> = {
    quickStart: () => tsx(quickStart),
    editing: () => tsx(editing),
    gridProps: () => gridPropsTable(locale),
    columnProps: () => columnPropsTable(locale),
  };
  return source.replace(
    /\{\{(\w+)\}\}/g,
    (token, name: string) => replacements[name]?.() ?? token,
  );
}
