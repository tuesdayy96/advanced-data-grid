import { lazy, Suspense, useEffect, useRef } from "react";
import { BrowserRouter, Link, Navigate, useLocation } from "react-router";
import { docPath, pages } from "./docs/navigation";
import { playgroundPath, playgroundText, type Locale } from "./i18n";
import { PlaygroundPage } from "./PlaygroundPage";
import "./site.css";

const DocsPage = lazy(() => import("./docs/DocsPage"));

function Site() {
  const { pathname, search } = useLocation();
  const path = pathname.replace(/\/+$/, "") || "/";
  const match = /^\/docs\/(en|ko)(?:\/(.*))?$/.exec(path);
  const locale: Locale = match
    ? match[1] === "ko"
      ? "ko"
      : "en"
    : new URLSearchParams(search).get("lang") === "ko"
      ? "ko"
      : "en";
  const page = match && pages.find(({ slug }) => slug === (match[2] ?? ""));
  const playground = path === "/";
  const korean = locale === "ko";
  const heading = page
    ? page.title[locale]
    : playground
      ? playgroundText[locale].title
      : korean
        ? "페이지를 찾을 수 없습니다"
        : "Page not found";
  const description = page
    ? page.description[locale]
    : playground
      ? playgroundText[locale].intro
      : heading;
  const navigationKey = path + search;
  const previousNavigation = useRef(navigationKey);
  const shouldFocus = previousNavigation.current !== navigationKey;

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = `${heading} | Advanced Data Grid`;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", description);
    previousNavigation.current = navigationKey;
    if (shouldFocus) {
      document.getElementById("main-content")?.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }
  }, [description, heading, locale, navigationKey, shouldFocus]);

  useEffect(() => {
    if (!page) return;
    const links = (["en", "ko"] as const).map((language) => {
      const link = document.createElement("link");
      link.rel = "alternate";
      link.hreflang = language;
      link.href = docPath(language, page.slug);
      document.head.append(link);
      return link;
    });
    return () => links.forEach((link) => link.remove());
  }, [page]);

  if (path === "/docs") return <Navigate to={docPath("en")} replace />;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <a className="skip-link" href="#main-content">
        {korean ? "본문으로 건너뛰기" : "Skip to content"}
      </a>
      <header className="site-header">
        <div className="site-header-inner">
          <Link className="site-brand" to={playgroundPath(locale)}>
            <span
              aria-hidden="true"
              className="grid size-8 shrink-0 grid-cols-2 gap-1 rounded-lg bg-indigo-700 p-2"
            >
              <span className="rounded-xs bg-white" />
              <span className="rounded-xs bg-indigo-300" />
              <span className="rounded-xs bg-indigo-300" />
              <span className="rounded-xs bg-white" />
            </span>
            Advanced Data Grid
          </Link>
          <nav
            className="site-nav"
            aria-label={korean ? "주 내비게이션" : "Main navigation"}
          >
            <Link
              to={playgroundPath(locale)}
              aria-current={playground ? "page" : undefined}
            >
              {korean ? "플레이그라운드" : "Playground"}
            </Link>
            <Link
              to={docPath(locale)}
              aria-current={match ? "location" : undefined}
            >
              {korean ? "문서" : "Docs"}
            </Link>
          </nav>
          <nav
            className="site-languages"
            aria-label={korean ? "언어" : "Language"}
          >
            {(["en", "ko"] as const).map((language) => (
              <Link
                key={language}
                aria-current={language === locale ? "true" : undefined}
                lang={language}
                hrefLang={language}
                title={language === "en" ? "English" : "한국어"}
                to={
                  playground
                    ? playgroundPath(language)
                    : docPath(language, page ? page.slug : "")
                }
              >
                {language.toUpperCase()}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      {playground ? (
        <PlaygroundPage locale={locale} />
      ) : page ? (
        <Suspense
          fallback={
            <main
              id="main-content"
              tabIndex={-1}
              className="site-message"
              role="status"
            >
              {korean ? "문서 불러오는 중…" : "Loading documentation…"}
            </main>
          }
        >
          <DocsPage page={page} locale={locale} focusOnMount={shouldFocus} />
        </Suspense>
      ) : (
        <main id="main-content" tabIndex={-1} className="site-message">
          <h1>{heading}</h1>
          <Link to={docPath(locale)}>
            {korean ? "문서 홈으로 이동" : "Go to documentation home"}
          </Link>
        </main>
      )}
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Site />
    </BrowserRouter>
  );
}
