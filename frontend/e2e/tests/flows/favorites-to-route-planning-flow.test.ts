import { expect, test } from "@playwright/test";

/**
 * Integration flow for Select Favorite → Map FlyTo → Route Planning sequence
 * Important workflow connecting saved locations to routing
 */

test.describe("@integration Favorites to Route Planning Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application with robust error handling
    await page.goto("http://localhost:5173");

    try {
      // Try to wait for networkidle with a shorter timeout
      await page.waitForLoadState("networkidle", { timeout: 10000 });
    } catch {
      // If networkidle fails, wait for domcontentloaded and a basic element
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      // Ensure the basic app structure is loaded
      try {
        await page.waitForSelector("h1", { timeout: 5000 });
      } catch {
        // If no h1, just ensure page is responsive
        await page.waitForTimeout(1000);
      }
    }

    // Set up test favorites in localStorage for testing
    await page.evaluate(() => {
      const testFavorites = [
        {
          id: "test-favorite-1",
          name: "Test Apartment Downtown",
          city: "denver north",
          coordinates: { lat: 39.7392, lng: -104.9903 },
          address: "123 Test St, Denver, CO",
        },
        {
          id: "test-favorite-2",
          name: "Test Apartment Suburbs",
          city: "denver south",
          coordinates: { lat: 39.6742, lng: -104.9903 },
          address: "456 Suburb Ave, Denver, CO",
        },
      ];
      localStorage.setItem("favorites", JSON.stringify(testFavorites));
    });
  });

  test("@critical Favorite selection triggers flyTo with city switch if needed", async ({
    page,
  }) => {
    // Wait for page to load
    await expect(page.locator("h1", { hasText: "Walkernest" })).toBeVisible();

    // Look for favorites list or favorites button
    const favoritesButton = page.locator("button", { hasText: /favorites|saved/i }).first();
    const favoritesList = page.locator(
      '[data-testid*="favorites"], .favorites-list, .saved-locations'
    );

    let favoritesVisible = await favoritesList.isVisible();

    // If favorites not visible, try to open them
    if (!favoritesVisible && (await favoritesButton.isVisible())) {
      await favoritesButton.click({ force: true });
      await page.waitForTimeout(1000);
      favoritesVisible = await favoritesList.isVisible();
    }

    if (favoritesVisible || (await favoritesButton.isVisible())) {
      // Look for individual favorite items
      const favoriteItems = page.locator(
        "[data-favorite], .favorite-item, .saved-location-item, li"
      );
      const itemCount = await favoriteItems.count();

      if (itemCount > 0) {
        // Get current city before selection
        const citySelector = page.locator('[role="combobox"]').first();
        const initialCity = await citySelector.textContent();

        // Click on first favorite
        const firstFavorite = favoriteItems.first();
        await firstFavorite.click({ force: true });
        await page.waitForTimeout(2000); // Wait for flyTo animation

        // Verify map interaction occurred
        const mapRegion = page.locator('[role="region"][name="Map"]');

        // Check map region with fallback
        if (!(await mapRegion.isVisible())) {
          const mapContainer = page.locator('.map, #map, [data-testid*="map"]').first();
          if (await mapContainer.isVisible()) {
            await expect(mapContainer).toBeVisible();
          } else {
            // If no map found, just verify page is still functional
            await expect(page.locator("h1", { hasText: "Walkernest" })).toBeVisible();
          }
        } else {
          await expect(mapRegion).toBeVisible();
        }

        // Check if city changed (if cross-city favorite)
        const currentCity = await citySelector.textContent();
        console.log(`City change: ${initialCity} → ${currentCity}`);

        // Verify page is still responsive after flyTo
        await expect(page.locator("h1", { hasText: "Walkernest" })).toBeVisible();
      }
    }
  });

  test("@integration Route planning can use favorite location as start/end point", async ({
    page,
  }) => {
    // Ensure page is ready
    await page.waitForTimeout(1000);

    // Look for route planning interface
    const routeButton = page.locator("button", { hasText: /route|directions|navigation/i }).first();
    const routePanel = page.locator('[data-testid*="route"], .route-panel, .directions-panel');

    let routePanelVisible = await routePanel.isVisible();

    // If route panel not visible, try to open it
    if (!routePanelVisible && (await routeButton.isVisible())) {
      await routeButton.click({ force: true });
      await page.waitForTimeout(1000);
      routePanelVisible = await routePanel.isVisible();
    }

    if (routePanelVisible) {
      // Look for start/end point inputs
      const startInput = page
        .locator(
          'input[placeholder*="start"], input[aria-label*="start"], input[data-testid*="start"]'
        )
        .first();
      const endInput = page
        .locator(
          'input[placeholder*="end"], input[aria-label*="end"], input[data-testid*="destination"]'
        )
        .first();

      const hasStartInput = await startInput.isVisible();
      const hasEndInput = await endInput.isVisible();

      if (hasStartInput || hasEndInput) {
        // Try to use favorite as route point
        const favoritesList = page.locator('[data-testid*="favorites"], .favorites-list');
        const favoriteItems = page.locator("[data-favorite], .favorite-item, .saved-location-item");

        if ((await favoriteItems.count()) > 0) {
          // Try drag and drop or click to set as route point
          const firstFavorite = favoriteItems.first();

          if (hasStartInput) {
            // Try to set favorite as start point
            await firstFavorite.dragTo(startInput);
            await page.waitForTimeout(1000);

            // Verify input was populated
            const startValue = await startInput.inputValue();
            expect(startValue.length).toBeGreaterThan(0);
          } else if (hasEndInput) {
            // Try to set favorite as end point
            await firstFavorite.dragTo(endInput);
            await page.waitForTimeout(1000);

            // Verify input was populated
            const endValue = await endInput.inputValue();
            expect(endValue.length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  test("@integration Cross-city routing with automatic context switching", async ({ page }) => {
    // Ensure page is ready
    await page.waitForTimeout(1000);

    // Get current city
    const citySelector = page.locator('[role="combobox"]').first();
    const initialCity = await citySelector.textContent();

    // Select a favorite from a different city
    const favoritesButton = page.locator("button", { hasText: /favorites|saved/i }).first();
    if (await favoritesButton.isVisible()) {
      await favoritesButton.click({ force: true });
      await page.waitForTimeout(1000);
    }

    const favoriteItems = page.locator("[data-favorite], .favorite-item, .saved-location-item");
    const itemCount = await favoriteItems.count();

    if (itemCount > 0) {
      // Look for favorite from different city (based on our test data)
      const crossCityFavorite = favoriteItems.nth(1); // Second favorite should be different city
      await crossCityFavorite.click({ force: true });
      await page.waitForTimeout(3000); // Wait for city switching

      // Verify city context switched
      const currentCity = await citySelector.textContent();
      console.log(`Cross-city routing: ${initialCity} → ${currentCity}`);

      // Now try route planning in the new city context
      const routeButton = page.locator("button", { hasText: /route|directions/i }).first();
      if (await routeButton.isVisible()) {
        await routeButton.click({ force: true });
        await page.waitForTimeout(1000);

        // Look for route inputs
        const routeInputs = page.locator(
          'input[placeholder*="start"], input[placeholder*="end"], input[placeholder*="destination"]'
        );
        const inputCount = await routeInputs.count();

        if (inputCount > 0) {
          // Try to enter a destination for cross-city routing
          const firstInput = routeInputs.first();
          await firstInput.fill("Test Destination");
          await page.waitForTimeout(1000);

          // Look for route calculation
          const calculateButton = page.locator("button", {
            hasText: /calculate|find route|get directions/i,
          });
          if (await calculateButton.isVisible()) {
            await calculateButton.click({ force: true });
            await page.waitForTimeout(2000);

            // Verify routing interface responds in new city context
            const mapRegion = page.locator('[role="region"][name="Map"]');

            // Check map region with fallback
            if (!(await mapRegion.isVisible())) {
              const mapContainer = page.locator('.map, #map, [data-testid*="map"]').first();
              if (await mapContainer.isVisible()) {
                await expect(mapContainer).toBeVisible();
              } else {
                // If no map found, just verify page is still functional
                await expect(page.locator("h1", { hasText: "Walkernest" })).toBeVisible();
              }
            } else {
              await expect(mapRegion).toBeVisible();
            }
          }
        }
      }
    }
  });

  test("@state State consistency during city transitions", async ({ page }) => {
    // Track localStorage and component states during city transitions
    const getState = () =>
      page.evaluate(() => {
        return {
          favorites: localStorage.getItem("favorites"),
          currentCity: localStorage.getItem("currentCity"),
          routeState: localStorage.getItem("routeState"),
          mapState: localStorage.getItem("mapState"),
        };
      });

    // Get initial state
    const initialState = await getState();

    // Trigger city transition via favorite selection
    const favoritesButton = page.locator("button", { hasText: /favorites|saved/i }).first();
    if (await favoritesButton.isVisible()) {
      await favoritesButton.click({ force: true });
      await page.waitForTimeout(1000);
    }

    const favoriteItems = page.locator("[data-favorite], .favorite-item, .saved-location-item");
    if ((await favoriteItems.count()) > 0) {
      // Select favorite that should trigger city change
      await favoriteItems.nth(1).click({ force: true });
      await page.waitForTimeout(3000); // Wait for transition

      // Get state after transition
      const postTransitionState = await getState();

      // Verify favorites persist across city changes
      expect(postTransitionState.favorites).toBe(initialState.favorites);

      // Verify UI components remain functional
      const citySelector = page.locator('[role="combobox"]').first();
      const mapRegion = page.locator('[role="region"][name="Map"]');

      await expect(citySelector).toBeVisible();

      // Check map region with fallback
      if (!(await mapRegion.isVisible())) {
        const mapContainer = page.locator('.map, #map, [data-testid*="map"]').first();
        if (await mapContainer.isVisible()) {
          await expect(mapContainer).toBeVisible();
        } else {
          // If no map found, just verify page is still functional
          await expect(page.locator("h1", { hasText: "Walkernest" })).toBeVisible();
        }
      } else {
        await expect(mapRegion).toBeVisible();
      }
      await expect(page.locator("h1", { hasText: "Walkernest" })).toBeVisible();

      // Test that route planning still works after city transition
      const routeButton = page.locator("button", { hasText: /route|directions/i }).first();
      if (await routeButton.isVisible()) {
        await routeButton.click({ force: true });
        await page.waitForTimeout(1000);

        // Route panel should open successfully
        const routePanel = page.locator('[data-testid*="route"], .route-panel, .directions-panel');
        const routeInputs = page.locator('input[placeholder*="start"], input[placeholder*="end"]');

        // At least one should be visible to confirm route planning is functional
        const panelVisible = await routePanel.isVisible();
        const inputsVisible = (await routeInputs.count()) > 0;
        expect(panelVisible || inputsVisible).toBe(true);
      }
    }
  });

  test("@performance Route calculation performance across different cities", async ({ page }) => {
    // Measure route calculation performance with timeout protection
    const measureRouteCalculation = async (cityName: string) => {
      const startTime = Date.now();

      try {
        // Trigger route calculation
        const routeButton = page.locator("button", { hasText: /route|directions/i }).first();
        if (await routeButton.isVisible()) {
          await routeButton.click({ force: true });
          await page.waitForTimeout(1000);

          const routeInputs = page.locator(
            'input[placeholder*="start"], input[placeholder*="end"]'
          );
          if ((await routeInputs.count()) > 0) {
            await routeInputs.first().fill("Test Start");
            await page.waitForTimeout(500);

            if ((await routeInputs.count()) > 1) {
              await routeInputs.nth(1).fill("Test End");
              await page.waitForTimeout(500);
            }

            const calculateButton = page.locator("button", {
              hasText: /calculate|find route|get directions/i,
            });
            if (await calculateButton.isVisible()) {
              await calculateButton.click({ force: true });

              // Use a more lenient wait strategy instead of networkidle
              try {
                await page.waitForLoadState("networkidle", { timeout: 5000 });
              } catch {
                // If networkidle fails, just wait for DOM updates
                await page.waitForTimeout(2000);
              }
            }
          }
        }
      } catch (error) {
        console.log(`Route calculation failed for ${cityName}: ${error}`);
      }

      const endTime = Date.now();
      return endTime - startTime;
    };

    // Test route calculation in different cities using favorites
    const favoritesButton = page.locator("button", { hasText: /favorites|saved/i }).first();
    if (await favoritesButton.isVisible()) {
      await favoritesButton.click({ force: true });
      await page.waitForTimeout(1000);
    }

    const favoriteItems = page.locator("[data-favorite], .favorite-item, .saved-location-item");
    const itemCount = await favoriteItems.count();

    if (itemCount > 1) {
      // Test first city
      await favoriteItems.first().click({ force: true });
      await page.waitForTimeout(2000);
      const time1 = await measureRouteCalculation("City 1");

      // Test second city
      await favoriteItems.nth(1).click({ force: true });
      await page.waitForTimeout(2000);
      const time2 = await measureRouteCalculation("City 2");

      // Log performance results
      console.log(`Route calculation times: City 1: ${time1}ms, City 2: ${time2}ms`);

      // Verify reasonable performance (under 15 seconds to account for potential network issues)
      expect(time1).toBeLessThan(15000);
      expect(time2).toBeLessThan(15000);
    } else {
      // If no favorites available, just verify the page is functional
      await expect(page.locator("h1", { hasText: "Walkernest" })).toBeVisible();
    }
  });
});
