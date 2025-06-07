import { defineConfig, devices } from "@playwright/test";

/**
 * Balanced Parallel Execution Configuration
 *
 * Focus: Good balance between speed and resource usage
 * Use case: Standard development and CI/CD environments
 */
export default defineConfig({
  testDir: "../tests",
  outputDir: "../test-results",

  // Balanced settings
  timeout: 45000, // 45 seconds per test
  expect: { timeout: 8000 }, // 8 second assertions

  // Moderate parallelism
  workers: process.env.CI ? 4 : 2, // 4 workers in CI, 2 locally
  fullyParallel: true, // Allow test files to run in parallel
  retries: process.env.CI ? 2 : 1, // More retries in CI

  reporter: [
    ["html", { outputFolder: "test-results/balanced-html" }],
    ["json", { outputFile: "test-results/balanced-results.json" }],
    ["list"],
  ],

  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "off",
    video: "off",

    // Balanced timeout settings
    actionTimeout: 10000,
    navigationTimeout: 20000,
  },

  projects: [
    // Desktop browsers - parallel execution (exclude touch-real-device tests)
    {
      name: "chromium-balanced",
      use: { ...devices["Desktop Chrome"] },
      grepInvert: /@touch-real-device/,
    },
    // Edge only available on Windows (exclude touch-real-device tests)
    ...(process.platform === "win32"
      ? [
          {
            name: "edge-balanced",
            use: { ...devices["Desktop Edge"], channel: "msedge" },
            grepInvert: /@touch-real-device/,
          },
        ]
      : []),

    // Mobile - limited to important devices with enhanced touch support
    {
      name: "mobile-iphone-balanced",
      use: {
        ...devices["iPhone 13"],
        hasTouch: true,
        isMobile: true,
        // Enhanced touch event configuration
        userAgent: devices["iPhone 13"].userAgent,
      },
    },

    // Touch simulation tests (fast)
    {
      name: "touch-simulation-balanced",
      use: {
        ...devices["iPhone 13"],
        headless: true,
        hasTouch: true,
        isMobile: true,
      },
      grep: /@touch-simulation/,
    },

    // Real device touch tests (only on mobile projects)
    {
      name: "touch-real-device-balanced",
      use: {
        ...devices["iPhone 13"],
        headless: false,
        hasTouch: true,
        isMobile: true,
        viewport: { width: 375, height: 812 },
      },
      grep: /@touch-real-device/,
    },
  ],

  webServer: {
    command: "npm run dev",
    port: 5173,
    reuseExistingServer: !process.env.CI,
    timeout: 90000, // 90 seconds to start server
  },
});
