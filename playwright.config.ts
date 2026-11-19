import { env } from "node:process";
import { defineConfig, devices } from "@playwright/test";

const development = env.ADG_E2E_DEV === "1";
const port = 4180;
const url = env.ADG_E2E_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  testIgnore: env.ADG_PERF === "1" ? [] : ["**/performance.spec.ts"],
  timeout: 45_000,
  workers: 1,
  forbidOnly: !!env.CI,
  use: {
    baseURL: url,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: env.ADG_E2E_URL
    ? undefined
    : {
        command: development
          ? `pnpm dev --host 127.0.0.1 --port ${port} --strictPort`
          : `pnpm build && pnpm --filter @advanced-data-grid/playground exec vite preview --configLoader runner --host 127.0.0.1 --port ${port} --strictPort`,
        url,
        timeout: 90_000,
        reuseExistingServer: false,
      },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    ...(env.ADG_E2E_EDGE === "1"
      ? [
          {
            name: "edge",
            use: { ...devices["Desktop Edge"], channel: "msedge" },
          },
        ]
      : []),
  ],
});
