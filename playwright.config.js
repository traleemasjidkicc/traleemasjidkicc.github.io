// @ts-check
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3099",
    trace: "on-first-retry",
    ...devices["Desktop Chrome"],
    channel: "chrome",
  },
  webServer: {
    command:
      "npx browser-sync start --server --port 3099 --host 127.0.0.1 --no-open --no-notify",
    url: "http://127.0.0.1:3099",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    {
      name: "chrome",
      use: { channel: "chrome" },
    },
  ],
});
