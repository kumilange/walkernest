import { defineConfig, devices } from "@playwright/test";

/**
 * Default Balanced Parallel Execution Configuration for WalkerNest E2E Testing
 *
 * Focus: Good balance between speed and resource usage
 * Use case: Standard development and CI/CD environments
 *
 * Note: Firefox is excluded from testing due to:
 * - Low user percentage in target market
 * - Additional complexity in E2E test setup and maintenance
 * - Resource optimization for faster CI/CD execution
 */
export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results",

  // Balanced settings
  timeout: 45000, // 45 seconds per test
  expect: { timeout: 8000 }, // 8 second assertions

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Moderate parallelism
  workers: process.env.CI ? 4 : 2, // 4 workers in CI, 2 locally
  fullyParallel: true, // Allow test files to run in parallel
  retries: process.env.CI ? 2 : 1, // More retries in CI

  // Reporter configuration
  reporter: [
    ["html", { outputFolder: "./test-results/html" }],
    ["json", { outputFile: "./test-results/results.json" }],
    ["list"],
  ],

  // Shared settings for all the projects below
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "off",
    video: "off",

    // Balanced timeout settings
    actionTimeout: 10000,
    navigationTimeout: 20000,
  },

  // Configure projects for balanced parallel execution
  projects: [
    // Desktop browsers - parallel execution (exclude touch-real-device tests)
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      grepInvert: /@touch-real-device/,
    },
    // Edge only available on Windows (exclude touch-real-device tests)
    ...(process.platform === "win32"
      ? [
          {
            name: "edge",
            use: { ...devices["Desktop Edge"], channel: "msedge" },
            grepInvert: /@touch-real-device/,
          },
        ]
      : []),

    // Mobile - limited to important devices with enhanced touch support
    {
      name: "mobile-iphone",
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
      name: "touch-simulation",
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
      name: "touch-real-device",
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

  // Run your local dev servers before starting the tests
  webServer: [
    // Backend server (Docker) - run from root level
    {
      command: "npm run dev",
      cwd: "../..", // Run from root directory (walkernest)
      port: 3000,
      reuseExistingServer: true, // Use manually started server
      timeout: 120000, // 2 minutes to start Docker services
    },
    // Frontend server - run from frontend directory
    {
      command:
        "VITE_API_PROTOCOL=http VITE_API_DOMAIN=localhost:3000 VITE_MAPTILER_API_KEY=bW9foxCIoM3h5VZO8uZr npm run dev",
      cwd: "..", // Run from frontend directory
      port: 5173,
      reuseExistingServer: true, // Use manually started server
      timeout: 90000, // 90 seconds to start server
    },
  ],
});
