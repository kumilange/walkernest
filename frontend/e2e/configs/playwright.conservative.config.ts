import { defineConfig, devices } from "@playwright/test";

/**
 * Conservative Parallel Execution Configuration
 *
 * Focus: Reliability and resource conservation
 * Use case: Resource-constrained environments, initial testing
 */
export default defineConfig({
  testDir: "../tests",
  outputDir: "../test-results",

  // Conservative settings
  timeout: 60000, // 1 minute per test
  expect: { timeout: 10000 }, // 10 second assertions

  // Limit parallelism for stability
  workers: 2, // Only 2 parallel workers
  fullyParallel: false, // Run test files sequentially
  retries: 2, // Allow retries for stability

  // Artifact settings (disabled for performance)
  reporter: [
    ["html", { outputFolder: "test-results/conservative-html" }],
    ["json", { outputFile: "test-results/conservative-results.json" }],
    ["list"],
  ],

  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure", // Only on failure
    screenshot: "off",
    video: "off",

    // Conservative timeout settings
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  projects: [
    // Run browsers sequentially, one at a time
    {
      name: "chromium-conservative",
      use: { ...devices["Desktop Chrome"] },
    },
    // Only test Chrome initially for speed
  ],

  webServer: {
    command: "npm run dev",
    port: 5173,
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes to start server
  },
});
