import type { Locale } from "../i18n";

export const pages = [
  {
    slug: "",
    title: {
      en: "Introduction",
      ko: "소개",
    },
    description: {
      en: "Overview of the React data grid and its capabilities.",
      ko: "React 데이터 그리드와 제공 기능을 소개합니다.",
    },
  },
  {
    slug: "installation",
    title: {
      en: "Installation",
      ko: "설치",
    },
    description: {
      en: "Install the package from npm and import its stylesheet.",
      ko: "npm에서 패키지를 설치하고 스타일시트를 불러옵니다.",
    },
  },
  {
    slug: "quick-start",
    title: {
      en: "Quick Start",
      ko: "빠른 시작",
    },
    description: {
      en: "Render your first typed data grid.",
      ko: "타입이 지정된 첫 데이터 그리드를 렌더링합니다.",
    },
  },
  {
    slug: "features",
    title: {
      en: "Features",
      ko: "기능",
    },
    description: {
      en: "Explore the supported grid features and current limits.",
      ko: "그리드 기능과 현재 제약을 살펴봅니다.",
    },
  },
  {
    slug: "api/data-grid",
    title: {
      en: "DataGrid Props",
      ko: "DataGrid Props",
    },
    description: {
      en: "Reference for the DataGrid component props.",
      ko: "DataGrid 컴포넌트의 props를 설명합니다.",
    },
  },
  {
    slug: "api/columns",
    title: {
      en: "ColumnDef",
      ko: "ColumnDef",
    },
    description: {
      en: "Reference for column definitions and options.",
      ko: "컬럼 정의와 옵션을 설명합니다.",
    },
  },
  {
    slug: "api/events",
    title: {
      en: "Events & Types",
      ko: "이벤트와 타입",
    },
    description: {
      en: "Public event callbacks and exported TypeScript types.",
      ko: "공개 이벤트 콜백과 내보내는 TypeScript 타입을 설명합니다.",
    },
  },
  {
    slug: "guides/virtualization",
    title: {
      en: "Virtual Scrolling",
      ko: "가상 스크롤",
    },
    description: {
      en: "Render large datasets using a bounded set of DOM rows.",
      ko: "제한된 수의 DOM 행으로 대용량 데이터를 표시합니다.",
    },
  },
  {
    slug: "guides/selection",
    title: {
      en: "Selection & Keyboard",
      ko: "선택 및 키보드",
    },
    description: {
      en: "Select cells and navigate with a keyboard or pointer.",
      ko: "키보드와 포인터로 셀을 선택하고 이동합니다.",
    },
  },
  {
    slug: "guides/editing",
    title: {
      en: "Cell Editing",
      ko: "셀 편집",
    },
    description: {
      en: "Configure editors, validate input, and apply changes.",
      ko: "편집기를 설정하고 값을 검증하고 반영합니다.",
    },
  },
  {
    slug: "guides/sorting-filtering",
    title: {
      en: "Sorting & Filtering",
      ko: "정렬 및 필터링",
    },
    description: {
      en: "Sort, filter, and search local rows.",
      ko: "로컬 행을 정렬·필터링하고 검색합니다.",
    },
  },
  {
    slug: "guides/clipboard-columns",
    title: {
      en: "Clipboard & Columns",
      ko: "클립보드와 컬럼",
    },
    description: {
      en: "Copy ranges, resize columns, and pin columns.",
      ko: "범위를 복사하고 컬럼 너비와 고정을 설정합니다.",
    },
  },
] as const;
export type DocPage = (typeof pages)[number];
export const docPath = (locale: Locale, slug = "") =>
  `/docs/${locale}${slug ? `/${slug}` : ""}`;

export const groups = [
  {
    title: { en: "Getting Started", ko: "시작하기" },
    pages: pages.filter(({ slug }) => !slug.includes("/")),
  },
  {
    title: { en: "API Reference", ko: "API 레퍼런스" },
    pages: pages.filter(({ slug }) => slug.startsWith("api/")),
  },
  {
    title: { en: "Guides", ko: "가이드" },
    pages: pages.filter(({ slug }) => slug.startsWith("guides/")),
  },
];
