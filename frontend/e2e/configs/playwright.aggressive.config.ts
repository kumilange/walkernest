import { defineConfig, devices } from "@playwright/test";

/**
 * Aggressive Parallel Execution Configuration
 *
 * Focus: Maximum speed and parallelism
 * Use case: High-resource environments, time-critical testing
 */
export default defineConfig({
  testDir: "../tests",
  outputDir: "../test-results",

  // Aggressive settings for speed
  timeout: 30000, // 30 seconds per test
  expect: { timeout: 5000 }, // 5 second assertions

  // Maximum parallelism
  workers: process.env.CI ? 8 : 4, // 8 workers in CI, 4 locally
  fullyParallel: true, // Full parallel execution
  retries: 1, // Minimal retries for speed

  reporter: [
    ["html", { outputFolder: "test-results/aggressive-html" }],
    ["json", { outputFile: "test-results/aggressive-results.json" }],
    ["list"],
  ],

  use: {
    baseURL: "http://localhost:5173",
    trace: "off", // Disable for maximum speed
    screenshot: "off",
    video: "off",

    // Aggressive timeout settings
    actionTimeout: 8000,
    navigationTimeout: 15000,
  },

  projects: [
    // All desktop browsers in parallel (exclude touch-real-device tests)
    {
      name: "chromium-aggressive",
      use: { ...devices["Desktop Chrome"] },
      grepInvert: /@touch-real-device/,
    },

    {
      name: "webkit-aggressive",
      use: { ...devices["Desktop Safari"] },
      grepInvert: /@touch-real-device/,
    },
    // Edge only available on Windows (exclude touch-real-device tests)
    ...(process.platform === "win32"
      ? [
          {
            name: "edge-aggressive",
            use: { ...devices["Desktop Edge"], channel: "msedge" },
            grepInvert: /@touch-real-device/,
          },
        ]
      : []),

    // All mobile devices in parallel with enhanced touch support
    {
      name: "mobile-iphone-13-aggressive",
      use: {
        ...devices["iPhone 13"],
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: "mobile-iphone-se-aggressive",
      use: {
        ...devices["iPhone SE"],
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: "mobile-samsung-aggressive",
      use: {
        ...devices["Galaxy S8+"],
        viewport: { width: 384, height: 854 },
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: "tablet-ipad-aggressive",
      use: {
        ...devices["iPad Pro"],
        hasTouch: true,
      },
    },

    // All touch test strategies with enhanced configuration
    {
      name: "touch-simulation-aggressive",
      use: {
        ...devices["iPhone 13"],
        headless: true,
        hasTouch: true,
        isMobile: true,
      },
      grep: /@touch-simulation/,
    },
    {
      name: "touch-real-device-aggressive",
      use: {
        ...devices["iPhone 13"],
        headless: false,
        hasTouch: true,
        isMobile: true,
        // Enhanced for real device testing
        viewport: { width: 375, height: 812 },
      },
      grep: /@touch-real-device/,
    },
  ],

  webServer: {
    command: "npm run dev",
    port: 5173,
    reuseExistingServer: !process.env.CI,
    timeout: 60000, // 1 minute to start server
  },
});
