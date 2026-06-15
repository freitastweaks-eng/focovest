import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  workers: 2,
  retries: 1,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    { name: "chromium-mobile", use: { ...devices["Pixel 7"] } },
    {
      name: "firefox-tablet",
      use: { ...devices["Desktop Firefox"], viewport: { width: 820, height: 1180 } },
    },
    { name: "webkit-desktop", use: { ...devices["Desktop Safari"] } },
  ],
});
