// @ts-check
import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;
const isHeaded = process.env.PW_HEADED === "1";
const testPort = 3000;
const baseURL = `http://127.0.0.1:${testPort}`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 1,
  workers: 1,
  reporter: [["list"], ["html", { open: isCI ? "never" : "on-failure" }]],
  timeout: 45_000,
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL,
    trace: "on-first-retry",
    headless: !isHeaded,
    ...devices["Desktop Edge"],
    channel: "msedge",
  },
  // Locally: run `yarn start` first (port 3000). CI starts its own static server.
  ...(isCI
    ? {
        webServer: {
          command: `node node_modules/browser-sync/dist/bin.js start --server --port ${testPort} --host 127.0.0.1 --no-open --no-notify --no-ui`,
          url: baseURL,
          timeout: 30_000,
          stdout: "pipe",
          stderr: "pipe",
        },
      }
    : {}),
  projects: [
    {
      name: "edge",
      use: {
        ...devices["Desktop Edge"],
        channel: "msedge",
      },
    },
  ],
});
