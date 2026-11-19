## 로컬 tarball에서 설치하기

Node.js 22.18 이상과 pnpm 10을 사용해 저장소 루트에서 라이브러리를 빌드하고 패키징합니다.

```sh
pnpm install
pnpm build:lib
pnpm --filter @advanced-data-grid/react-data-grid pack
```

생성된 `.tgz`를 사용할 앱에 복사한 뒤 아래 명령 중 하나를 실행합니다. 예제 파일명은 현재 워크스페이스 버전을 기준으로 합니다.

```sh
npm install ./advanced-data-grid-react-data-grid-0.1.0.tgz
pnpm add ./advanced-data-grid-react-data-grid-0.1.0.tgz
yarn add ./advanced-data-grid-react-data-grid-0.1.0.tgz
```

현재 0.1.0 공개 릴리스를 준비하고 있습니다. 공개 npm 레지스트리에 버전이 등록된 뒤에는 패키지명으로 설치할 수 있습니다.

```sh
npm install @advanced-data-grid/react-data-grid
pnpm add @advanced-data-grid/react-data-grid
yarn add @advanced-data-grid/react-data-grid
```

## 실행 환경과 스타일시트

앱에서 `react`와 `react-dom`의 버전을 맞추세요. 두 피어 의존성의 범위는 `^18.2.0 || ^19.0.0`입니다. 로컬 tarball을 설치해 React 18.3.1과 19.3.1에서 빠른 시작과 편집 예제를 렌더링했습니다. 패키지는 ESM 진입점과 TypeScript 선언을 제공합니다. 앱 진입점에서 스타일시트를 한 번 가져옵니다.

```ts
import "@advanced-data-grid/react-data-grid/styles.css";
```

[첫 그리드를 렌더링하세요.](/docs/ko/quick-start)
