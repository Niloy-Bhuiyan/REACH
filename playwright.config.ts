import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  workers: 4,
  reporter: [["list"]],
  timeout: 45_000,
  use: {
    baseURL: "http://localhost:3000",
    // The mock worker needs a moment on first load; every spec waits for real content.
    actionTimeout: 10_000,
  },
  webServer: {
    command: "npx next dev --port 3000",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
