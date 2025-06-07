import type { Page } from "@playwright/test";
import type {
  CityTestData,
  CoordinateTestData,
  FavoriteTestData,
  TestData,
} from "../types/TestTypes";

/**
 * Test utilities for common testing operations
 * Provides test data management, helper functions, and common assertions
 */
export class TestUtilities {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Get test data for different scenarios
   */
  getTestData(): TestData {
    return {
      cities: this.getCityTestData(),
      coordinates: this.getCoordinateTestData(),
      addresses: this.getAddressTestData(),
      favorites: this.getFavoriteTestData(),
    };
  }

  /**
   * City test data for different scenarios
   */
  private getCityTestData(): CityTestData[] {
    return [
      {
        name: "Berlin",
        slug: "berlin",
        coordinates: { lat: 52.52, lng: 13.405 },
        bounds: {
          north: 52.6755,
          south: 52.3382,
          east: 13.7611,
          west: 13.0883,
        },
      },
      {
        name: "Munich",
        slug: "munich",
        coordinates: { lat: 48.1351, lng: 11.582 },
        bounds: {
          north: 48.2482,
          south: 48.0616,
          east: 11.7223,
          west: 11.3608,
        },
      },
      {
        name: "Hamburg",
        slug: "hamburg",
        coordinates: { lat: 53.5511, lng: 9.9937 },
        bounds: {
          north: 53.7499,
          south: 53.3951,
          east: 10.3252,
          west: 9.7312,
        },
      },
    ];
  }

  /**
   * Coordinate test data for various locations
   */
  private getCoordinateTestData(): CoordinateTestData[] {
    return [
      {
        lat: 52.52,
        lng: 13.405,
        address: "Brandenburg Gate, Berlin",
        description: "Historic landmark in Berlin center",
      },
      {
        lat: 48.1351,
        lng: 11.582,
        address: "Marienplatz, Munich",
        description: "Central square in Munich",
      },
      {
        lat: 53.5511,
        lng: 9.9937,
        address: "Hamburg City Hall",
        description: "Historic city hall in Hamburg",
      },
    ];
  }

  /**
   * Address test data for geocoding tests
   */
  private getAddressTestData() {
    return [
      {
        address: "Potsdamer Platz 1",
        city: "Berlin",
        coordinates: { lat: 52.5096, lng: 13.3765 },
      },
      {
        address: "Maximilianstraße 1",
        city: "Munich",
        coordinates: { lat: 48.1392, lng: 11.5802 },
      },
      {
        address: "Mönckebergstraße 1",
        city: "Hamburg",
        coordinates: { lat: 53.5511, lng: 10.0015 },
      },
    ];
  }

  /**
   * Favorite test data for favorites functionality
   */
  private getFavoriteTestData(): FavoriteTestData[] {
    return [
      {
        name: "Test Apartment Berlin",
        address: "Unter den Linden 1, Berlin",
        city: "Berlin",
        coordinates: { lat: 52.517, lng: 13.3888 },
        features: {
          walkingDistances: {
            park: 300,
            supermarket: 150,
            cafe: 100,
          },
        },
      },
      {
        name: "Test Apartment Munich",
        address: "Leopoldstraße 1, Munich",
        city: "Munich",
        coordinates: { lat: 48.15, lng: 11.58 },
        features: {
          walkingDistances: {
            park: 250,
            supermarket: 200,
            cafe: 80,
          },
        },
      },
    ];
  }

  /**
   * Wait for map to be loaded and interactive
   */
  async waitForMapLoad(timeout = 10000): Promise<void> {
    // Wait for map container
    await this.page.waitForSelector(".maplibregl-map", { state: "visible", timeout });

    // Wait for map to be loaded (no loading indicators)
    await this.page.waitForFunction(
      () => {
        const map = document.querySelector(".maplibregl-map");
        return map && !document.querySelector('.loading, .spinner, [data-loading="true"]');
      },
      { timeout }
    );

    // Additional wait for map tiles to load
    await this.page.waitForTimeout(1000);
  }

  /**
   * Set up test environment with clean state
   */
  async setupTestEnvironment(): Promise<void> {
    // Clear all storage
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Navigate to home page
    await this.page.goto("/");

    // Wait for application to load
    await this.page.waitForSelector("#root", { state: "visible" });
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Monitor API responses for testing (instead of mocking)
   * Records real API interactions for validation
   */
  async monitorAPIResponse(urlPattern: string | RegExp): Promise<void> {
    await this.page.route(urlPattern, async (route) => {
      // Let the real request go through
      const response = await route.fetch();
      const body = await response.text();

      // Log API interaction for debugging
      console.log(`API Request: ${route.request().url()}`);
      console.log(`API Response: ${response.status()} - ${body.substring(0, 200)}...`);

      // Continue with real response
      await route.fulfill({
        status: response.status(),
        body,
        headers: response.headers(),
      });
    });
  }

  /**
   * Wait for real API response with retry mechanism
   */
  async waitForRealAPIResponse(
    urlPattern: string | RegExp,
    timeout = 15000,
    retries = 3
  ): Promise<{ success: boolean; response?: unknown; error?: string }> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await this.page.waitForResponse(
          (response) => {
            const url = response.url();
            if (typeof urlPattern === "string") {
              return url.includes(urlPattern);
            }
            return urlPattern.test(url);
          },
          { timeout }
        );

        if (response.ok()) {
          const data = await response.json();
          return { success: true, response: data };
        }

        console.warn(`API attempt ${attempt} failed with status: ${response.status()}`);
        if (attempt === retries) {
          return {
            success: false,
            error: `API failed with status ${response.status()} after ${retries} attempts`,
          };
        }
      } catch (error) {
        console.warn(`API attempt ${attempt} failed:`, error);
        if (attempt === retries) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown API error",
          };
        }
        // Wait before retry
        await this.page.waitForTimeout(1000 * attempt);
      }
    }

    return { success: false, error: "Unexpected retry loop exit" };
  }

  /**
   * Simulate network delay for API calls
   */
  async simulateNetworkDelay(urlPattern: string | RegExp, delay: number): Promise<void> {
    await this.page.route(urlPattern, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, delay));
      await route.continue();
    });
  }

  /**
   * Simulate API failure for error handling testing
   * This temporarily intercepts real API calls to test error scenarios
   */
  async simulateAPIFailure(urlPattern: string | RegExp, statusCode = 500): Promise<void> {
    await this.page.route(urlPattern, async (route) => {
      console.log(`Simulating API failure for: ${route.request().url()}`);
      await route.fulfill({
        status: statusCode,
        body: JSON.stringify({
          error: "Simulated API failure for testing",
          timestamp: new Date().toISOString(),
          originalUrl: route.request().url(),
        }),
        headers: { "Content-Type": "application/json" },
      });
    });
  }

  /**
   * Remove API failure simulation and restore real API calls
   */
  async restoreRealAPIResponses(urlPattern: string | RegExp): Promise<void> {
    await this.page.unroute(urlPattern);
    console.log(`Restored real API responses for pattern: ${urlPattern}`);
  }

  /**
   * Get current viewport size
   */
  async getViewportSize(): Promise<{ width: number; height: number }> {
    const viewport = this.page.viewportSize();
    return viewport || { width: 1280, height: 720 };
  }

  /**
   * Check if running on mobile device
   */
  async isMobileDevice(): Promise<boolean> {
    const viewport = await this.getViewportSize();
    return viewport.width <= 768;
  }

  /**
   * Scroll to element and ensure it's visible
   */
  async scrollToElement(selector: string): Promise<void> {
    const element = this.page.locator(selector);
    await element.scrollIntoViewIfNeeded();
    await element.waitFor({ state: "visible" });
  }

  /**
   * Wait for element to be stable (not moving)
   */
  async waitForElementStable(selector: string, timeout = 5000): Promise<void> {
    const element = this.page.locator(selector);
    await element.waitFor({ state: "visible" });

    // Wait for element to stop moving
    let previousBox = await element.boundingBox();
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      await this.page.waitForTimeout(100);
      const currentBox = await element.boundingBox();

      if (
        previousBox &&
        currentBox &&
        previousBox.x === currentBox.x &&
        previousBox.y === currentBox.y &&
        previousBox.width === currentBox.width &&
        previousBox.height === currentBox.height
      ) {
        return;
      }

      previousBox = currentBox;
    }
  }

  /**
   * Generate random test data
   */
  generateRandomCoordinate(bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  }): CoordinateTestData {
    const defaultBounds = {
      north: 52.6755,
      south: 52.3382,
      east: 13.7611,
      west: 13.0883,
    };

    const useBounds = bounds || defaultBounds;

    return {
      lat: Math.random() * (useBounds.north - useBounds.south) + useBounds.south,
      lng: Math.random() * (useBounds.east - useBounds.west) + useBounds.west,
      description: "Random test coordinate",
    };
  }

  /**
   * Take screenshot with timestamp
   */
  async takeTimestampedScreenshot(name: string): Promise<string> {
    const timestamp = Date.now();
    const filename = `${name}-${timestamp}.png`;
    const path = `e2e/test-results/screenshots/${filename}`;

    await this.page.screenshot({
      path,
      fullPage: true,
    });

    return filename;
  }

  /**
   * Clean up test data and reset application state
   * Ensures tests don't interfere with each other when using real APIs
   */
  async cleanupTestData(): Promise<void> {
    try {
      // Clear localStorage
      await this.page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      // Clear any cached data
      await this.page.evaluate(() => {
        // Clear any application-specific caches
        if (window.caches) {
          window.caches.keys().then((names) => {
            for (const name of names) {
              window.caches.delete(name);
            }
          });
        }
      });

      // Reset to home page with fresh state
      await this.page.goto("/");
      await this.page.waitForLoadState("networkidle");

      console.log("Test data cleanup completed");
    } catch (error) {
      console.warn("Test data cleanup failed:", error);
    }
  }

  /**
   * Validate real API response structure and data
   */
  async validateAPIResponse(
    response: unknown,
    expectedStructure: Record<string, "string" | "number" | "boolean" | "object" | "undefined">
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!response || typeof response !== "object") {
      errors.push("Response is not a valid object");
      return { valid: false, errors };
    }

    const responseObj = response as Record<string, unknown>;

    for (const [key, expectedType] of Object.entries(expectedStructure)) {
      if (!(key in responseObj)) {
        errors.push(`Missing required field: ${key}`);
      } else {
        const actualType = typeof responseObj[key];
        const isValidType =
          (expectedType === "string" && actualType === "string") ||
          (expectedType === "number" && actualType === "number") ||
          (expectedType === "boolean" && actualType === "boolean") ||
          (expectedType === "object" && actualType === "object") ||
          (expectedType === "undefined" && actualType === "undefined");

        if (!isValidType) {
          errors.push(`Field ${key} has wrong type. Expected ${expectedType}, got ${actualType}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Wait for real data to load with validation
   */
  async waitForRealDataLoad(
    dataIndicatorSelector: string,
    timeout = 30000
  ): Promise<{ success: boolean; dataCount?: number; error?: string }> {
    try {
      // Wait for data to appear
      await this.page.waitForSelector(dataIndicatorSelector, {
        state: "visible",
        timeout,
      });

      // Count loaded data items if possible
      const dataElements = this.page.locator(dataIndicatorSelector);
      const count = await dataElements.count();

      return { success: true, dataCount: count };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown data loading error",
      };
    }
  }

  /**
   * Log test step with timestamp
   */
  logTestStep(step: string, data?: unknown): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${step}`, data ? JSON.stringify(data, null, 2) : "");
  }
}
