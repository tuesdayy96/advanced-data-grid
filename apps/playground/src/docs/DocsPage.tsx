import {
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link } from "react-router";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import hljs from "highlight.js/lib/core";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import "highlight.js/styles/github-dark.css";
import { playgroundPath, type Locale } from "../i18n";
import { docPath, groups, type DocPage } from "./navigation";
import { getMarkdown } from "./content";
import "./docs.css";

hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("xml", xml);

function CodeBlock({
  children,
  locale,
}: {
  children: ReactNode;
  locale: Locale;
}) {
  const [status, setStatus] = useState<"copied" | "failed">();
  const code = isValidElement<{ className?: string; children?: ReactNode }>(
    children,
  )
    ? children.props
    : undefined;
  if (typeof code?.children !== "string") return <pre>{children}</pre>;
  const source = code.children.replace(/\n$/, "");
  const language = code.className?.replace("language-", "") ?? "";
  const highlight = ["ts", "tsx", "typescript"].includes(language);
  const korean = locale === "ko";

  async function copy() {
    try {
      await navigator.clipboard.writeText(source);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  }

  return (
    <div className="docs-code">
      <div className="docs-code-header">
        <span>{language}</span>
        <button type="button" onClick={() => void copy()}>
          {korean ? "코드 복사" : "Copy code"}
        </button>
      </div>
      <pre tabIndex={0} aria-label={korean ? "코드 예제" : "Code example"}>
        {highlight ? (
          <code
            className="hljs"
            dangerouslySetInnerHTML={{
              __html: hljs.highlight(source, { language: "typescript" }).value,
            }}
          />
        ) : (
          <code>{source}</code>
        )}
      </pre>
      <span className="docs-copy-status" role="status">
        {status === "copied"
          ? korean
            ? "복사했습니다."
            : "Copied."
          : status === "failed"
            ? korean
              ? "복사할 수 없습니다. 코드를 직접 선택하세요."
              : "Could not copy. Select the code manually."
            : ""}
      </span>
    </div>
  );
}

function DocsNavigation({ locale, page }: { locale: Locale; page: DocPage }) {
  return (
    <nav
      className="docs-links"
      aria-label={
        locale === "ko" ? "문서 내비게이션" : "Documentation navigation"
      }
    >
      {groups.map((group) => (
        <div key={group.title.en}>
          <p>{group.title[locale]}</p>
          <ul>
            {group.pages.map((item) => (
              <li key={item.slug}>
                <Link
                  to={docPath(locale, item.slug)}
                  aria-current={page.slug === item.slug ? "page" : undefined}
                >
                  {item.title[locale]}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export default function DocsPage({
  locale,
  page,
  focusOnMount,
}: {
  locale: Locale;
  page: DocPage;
  focusOnMount: boolean;
}) {
  const main = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusOnMount) main.current?.focus({ preventScroll: true });
  }, [focusOnMount]);

  const korean = locale === "ko";
  return (
    <div className="docs-layout">
      <aside className="docs-sidebar">
        <DocsNavigation locale={locale} page={page} />
      </aside>
      <details
        className="docs-mobile-nav"
        key={docPath(locale, page.slug)}
        onClick={(event) => {
          if (event.target instanceof Element && event.target.closest("a"))
            event.currentTarget.open = false;
        }}
      >
        <summary>{korean ? "문서 메뉴" : "Documentation menu"}</summary>
        <DocsNavigation locale={locale} page={page} />
      </details>
      <main id="main-content" className="docs-article" tabIndex={-1} ref={main}>
        <article key={docPath(locale, page.slug)} aria-labelledby="doc-heading">
          <h1 id="doc-heading">{page.title[locale]}</h1>
          <p className="doc-description">{page.description[locale]}</p>
          <Markdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children }) =>
                href?.startsWith("/") ? (
                  <Link to={href}>{children}</Link>
                ) : (
                  <a href={href}>{children}</a>
                ),
              pre: ({ children }) => (
                <CodeBlock locale={locale}>{children}</CodeBlock>
              ),
              table: ({ children }) => (
                <div
                  className="docs-table"
                  tabIndex={0}
                  role="region"
                  aria-label={korean ? "API 표" : "API table"}
                >
                  <table>{children}</table>
                </div>
              ),
              th: ({ children }) => <th scope="col">{children}</th>,
            }}
          >
            {getMarkdown(locale, page.slug)}
          </Markdown>
          <div className="docs-next">
            <Link to={playgroundPath(locale)}>
              {korean ? "플레이그라운드에서 체험하기" : "Try it in Playground"}
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
