import { type Page, expect } from "@playwright/test";
import type { CoordinateTestData, RouteData, RouteResult } from "../../types/TestTypes";
import { ErrorHandler } from "../../utils/ErrorHandler";
import { BaseComponent } from "../BaseComponent";

/**
 * Page Object for CheckRoute component
 * Handles route planning between points with map interaction and geocoding
 */
export class CheckRoutePage extends BaseComponent {
  private readonly errorHandler: ErrorHandler;

  // Selectors
  private readonly selectors = {
    container: "div.flex.flex-col.gap-4",

    // Point selection inputs
    startingPointInput: 'input[placeholder*="starting address"]',
    endingPointInput: 'input[placeholder*="ending address"]',

    // Point selection buttons
    startingMapPinButton: 'button[title*="Click on map to select point"]:first-of-type',
    endingMapPinButton: 'button[title*="Click on map to select point"]:last-of-type',

    startingClearButton: 'button[title*="Clear point"]:first-of-type',
    endingClearButton: 'button[title*="Clear point"]:last-of-type',

    // Reverse button
    reverseButton: 'button[title*="Reverse starting and ending points"]',
    reverseIcon: 'svg[data-lucide="arrow-down-up"]',

    // Point status indicators
    startingPointIcon: 'svg[data-lucide="locate"]',
    endingPointIcon: 'svg[data-lucide="locate-fixed"]',

    // Route result
    routeResult: '[data-testid="route-result"]',
    routeDistance: '[data-testid="route-distance"]',
    routeDuration: '[data-testid="route-duration"]',

    // Loading states
    loadingIndicator: '.loading, .spinner, [data-loading="true"]',

    // Map selection state
    mapSelectionActive: "input.border-green-500.bg-green-50",

    // Error states
    errorMessage: '[role="alert"]',
    geocodingError: '[data-testid="geocoding-error"]',
  };

  constructor(page: Page) {
    super(
      page,
      '[data-testid="check-route"], div.flex.flex-col.gap-4:has(input[placeholder*="address"])',
      "CheckRoute"
    );
    this.errorHandler = new ErrorHandler(page);
  }

  /**
   * Enter starting point address
   */
  async enterStartingAddress(address: string): Promise<void> {
    await this.errorHandler.withErrorHandling(
      async () => {
        await this.waitForComponent();

        const input = this.getComponentElement(this.selectors.startingPointInput);
        await input.clear();
        await input.fill(address);

        // Press Enter to trigger geocoding
        await input.press("Enter");

        // Wait for geocoding to complete
        await this.waitForGeocoding();
      },
      {
        component: "CheckRoute",
        step: "enterStartingAddress",
      }
    );
  }

  /**
   * Enter ending point address
   */
  async enterEndingAddress(address: string): Promise<void> {
    await this.errorHandler.withErrorHandling(
      async () => {
        await this.waitForComponent();

        const input = this.getComponentElement(this.selectors.endingPointInput);
        await input.clear();
        await input.fill(address);

        // Press Enter to trigger geocoding
        await input.press("Enter");

        // Wait for geocoding to complete
        await this.waitForGeocoding();
      },
      {
        component: "CheckRoute",
        step: "enterEndingAddress",
      }
    );
  }

  /**
   * Enable map selection for starting point
   */
  async enableStartingPointMapSelection(): Promise<void> {
    await this.errorHandler.withErrorHandling(
      async () => {
        const mapPinButton = this.getComponentElement(this.selectors.startingMapPinButton);
        await mapPinButton.click();

        // Verify map selection is active
        await this.page.waitForSelector(this.selectors.mapSelectionActive, {
          state: "visible",
          timeout: 2000,
        });
      },
      {
        component: "CheckRoute",
        step: "enableStartingPointMapSelection",
      }
    );
  }

  /**
   * Enable map selection for ending point
   */
  async enableEndingPointMapSelection(): Promise<void> {
    await this.errorHandler.withErrorHandling(
      async () => {
        const mapPinButton = this.getComponentElement(this.selectors.endingMapPinButton);
        await mapPinButton.click();

        // Verify map selection is active
        await this.page.waitForSelector(this.selectors.mapSelectionActive, {
          state: "visible",
          timeout: 2000,
        });
      },
      {
        component: "CheckRoute",
        step: "enableEndingPointMapSelection",
      }
    );
  }

  /**
   * Enable map selection with touch events
   */
  async enableMapSelectionWithTouch(isStarting: boolean): Promise<void> {
    await this.errorHandler.withErrorHandling(
      async () => {
        const selector = isStarting
          ? this.selectors.startingMapPinButton
          : this.selectors.endingMapPinButton;
        const mapPinButton = this.getComponentElement(selector);

        // Use touch events
        await mapPinButton.dispatchEvent("touchstart");
        await mapPinButton.dispatchEvent("touchend");
        await mapPinButton.click();

        // Verify map selection is active
        await this.page.waitForSelector(this.selectors.mapSelectionActive, {
          state: "visible",
          timeout: 2000,
        });
      },
      {
        component: "CheckRoute",
        step: "enableMapSelectionWithTouch",
      }
    );
  }

  /**
   * Clear starting point
   */
  async clearStartingPoint(): Promise<void> {
    await this.errorHandler.withErrorHandling(
      async () => {
        const clearButton = this.getComponentElement(this.selectors.startingClearButton);
        await clearButton.click();

        // Verify input is cleared
        const input = this.getComponentElement(this.selectors.startingPointInput);
        await expect(input).toHaveValue("");
      },
      {
        component: "CheckRoute",
        step: "clearStartingPoint",
      }
    );
  }

  /**
   * Clear ending point
   */
  async clearEndingPoint(): Promise<void> {
    await this.errorHandler.withErrorHandling(
      async () => {
        const clearButton = this.getComponentElement(this.selectors.endingClearButton);
        await clearButton.click();

        // Verify input is cleared
        const input = this.getComponentElement(this.selectors.endingPointInput);
        await expect(input).toHaveValue("");
      },
      {
        component: "CheckRoute",
        step: "clearEndingPoint",
      }
    );
  }

  /**
   * Clear point with touch events
   */
  async clearPointWithTouch(isStarting: boolean): Promise<void> {
    await this.errorHandler.withErrorHandling(
      async () => {
        const selector = isStarting
          ? this.selectors.startingClearButton
          : this.selectors.endingClearButton;
        const clearButton = this.getComponentElement(selector);

        // Use touch events
        await clearButton.dispatchEvent("touchstart");
        await clearButton.dispatchEvent("touchend");
        await clearButton.click();

        // Verify input is cleared
        const inputSelector = isStarting
          ? this.selectors.startingPointInput
          : this.selectors.endingPointInput;
        const input = this.getComponentElement(inputSelector);
        await expect(input).toHaveValue("");
      },
      {
        component: "CheckRoute",
        step: "clearPointWithTouch",
      }
    );
  }

  /**
   * Reverse starting and ending points
   */
  async reversePoints(): Promise<void> {
    await this.errorHandler.withErrorHandling(
      async () => {
        // Get current values
        const startingValue = await this.getComponentElement(
          this.selectors.startingPointInput
        ).inputValue();
        const endingValue = await this.getComponentElement(
          this.selectors.endingPointInput
        ).inputValue();

        // Click reverse button
        const reverseButton = this.getComponentElement(this.selectors.reverseButton);
        await reverseButton.click();

        // Wait for values to be swapped
        await this.page.waitForTimeout(500);

        // Verify values are swapped
        await expect(this.getComponentElement(this.selectors.startingPointInput)).toHaveValue(
          endingValue
        );
        await expect(this.getComponentElement(this.selectors.endingPointInput)).toHaveValue(
          startingValue
        );
      },
      {
        component: "CheckRoute",
        step: "reversePoints",
      }
    );
  }

  /**
   * Reverse points with touch events
   */
  async reversePointsWithTouch(): Promise<void> {
    await this.errorHandler.withErrorHandling(
      async () => {
        const reverseButton = this.getComponentElement(this.selectors.reverseButton);

        // Use touch events
        await reverseButton.dispatchEvent("touchstart");
        await reverseButton.dispatchEvent("touchend");
        await reverseButton.click();

        // Wait for swap to complete
        await this.page.waitForTimeout(500);
      },
      {
        component: "CheckRoute",
        step: "reversePointsWithTouch",
      }
    );
  }

  /**
   * Simulate map click for point selection
   */
  async simulateMapClick(coordinates: CoordinateTestData): Promise<void> {
    await this.errorHandler.withErrorHandling(
      async () => {
        // This would typically involve clicking on the map at specific coordinates
        // For now, we'll simulate by directly setting the coordinate values

        // Check if map selection is active
        const isSelectionActive = await this.isMapSelectionActive();
        if (!isSelectionActive) {
          throw new Error("Map selection is not active");
        }

        // Simulate map click by dispatching a custom event
        await this.page.evaluate((coords) => {
          const event = new CustomEvent("mapClick", {
            detail: { lngLat: { lng: coords.lng, lat: coords.lat } },
          });
          document.dispatchEvent(event);
        }, coordinates);

        // Wait for point to be set
        await this.page.waitForTimeout(1000);
      },
      {
        component: "CheckRoute",
        step: "simulateMapClick",
      }
    );
  }

  /**
   * Check if map selection is currently active
   */
  async isMapSelectionActive(): Promise<boolean> {
    return await this.isElementVisible(this.selectors.mapSelectionActive);
  }

  /**
   * Check if reverse button is visible
   */
  async isReverseButtonVisible(): Promise<boolean> {
    return await this.isElementVisible(this.selectors.reverseButton);
  }

  /**
   * Wait for geocoding to complete
   */
  async waitForGeocoding(timeout = 10000): Promise<void> {
    // Wait for any loading indicators to disappear
    try {
      await this.page.waitForSelector(this.selectors.loadingIndicator, {
        state: "hidden",
        timeout: 1000,
      });
    } catch {
      // No loading indicator found, continue
    }

    // Wait for network idle to ensure geocoding request completed
    await this.page.waitForLoadState("networkidle", { timeout });
  }

  /**
   * Wait for route calculation to complete
   */
  async waitForRouteCalculation(timeout = 15000): Promise<void> {
    // Wait for route result to appear or error message
    try {
      await Promise.race([
        this.page.waitForSelector(this.selectors.routeResult, { state: "visible", timeout }),
        this.page.waitForSelector(this.selectors.errorMessage, { state: "visible", timeout }),
      ]);
    } catch {
      // Timeout - route calculation may have failed
    }
  }

  /**
   * Get route result information
   */
  async getRouteResult(): Promise<RouteResult | null> {
    try {
      const routeResultElement = this.getComponentElement(this.selectors.routeResult);

      if ((await routeResultElement.count()) === 0) {
        return null;
      }

      // Extract distance and duration if available
      let distance = 0;
      let duration = 0;

      const distanceElement = this.getComponentElement(this.selectors.routeDistance);
      if ((await distanceElement.count()) > 0) {
        const distanceText = await distanceElement.textContent();
        distance = this.parseDistance(distanceText || "");
      }

      const durationElement = this.getComponentElement(this.selectors.routeDuration);
      if ((await durationElement.count()) > 0) {
        const durationText = await durationElement.textContent();
        duration = this.parseDuration(durationText || "");
      }

      return {
        success: true,
        route: {
          coordinates: [], // Would need to extract from map
          distance,
          duration,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Parse distance text to number (in meters)
   */
  private parseDistance(text: string): number {
    const match = text.match(/(\d+(?:\.\d+)?)\s*(km|m)/i);
    if (match) {
      const value = Number.parseFloat(match[1]);
      const unit = match[2].toLowerCase();
      return unit === "km" ? value * 1000 : value;
    }
    return 0;
  }

  /**
   * Parse duration text to number (in seconds)
   */
  private parseDuration(text: string): number {
    const match = text.match(/(\d+(?:\.\d+)?)\s*(min|sec|hour)/i);
    if (match) {
      const value = Number.parseFloat(match[1]);
      const unit = match[2].toLowerCase();
      switch (unit) {
        case "hour":
          return value * 3600;
        case "min":
          return value * 60;
        case "sec":
          return value;
        default:
          return value;
      }
    }
    return 0;
  }

  /**
   * Get current point values
   */
  async getCurrentPoints(): Promise<{
    startingPoint: string;
    endingPoint: string;
  }> {
    const startingValue = await this.getComponentElement(
      this.selectors.startingPointInput
    ).inputValue();
    const endingValue = await this.getComponentElement(
      this.selectors.endingPointInput
    ).inputValue();

    return {
      startingPoint: startingValue,
      endingPoint: endingValue,
    };
  }

  /**
   * Check if both points are set
   */
  async areBothPointsSet(): Promise<boolean> {
    const points = await this.getCurrentPoints();
    return points.startingPoint.trim() !== "" && points.endingPoint.trim() !== "";
  }

  /**
   * Complete route planning workflow
   */
  async completeRouteWorkflow(routeData: RouteData): Promise<{
    success: boolean;
    duration: number;
    route?: RouteResult;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      // Set starting point
      if (routeData.start.address) {
        await this.enterStartingAddress(routeData.start.address);
      } else {
        await this.enableStartingPointMapSelection();
        await this.simulateMapClick(routeData.start);
      }

      // Set ending point
      if (routeData.end.address) {
        await this.enterEndingAddress(routeData.end.address);
      } else {
        await this.enableEndingPointMapSelection();
        await this.simulateMapClick(routeData.end);
      }

      // Wait for route calculation
      await this.waitForRouteCalculation();

      // Get route result
      const route = await this.getRouteResult();
      const duration = Date.now() - startTime;

      return {
        success: route?.success || false,
        duration,
        route: route || undefined,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        duration,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
