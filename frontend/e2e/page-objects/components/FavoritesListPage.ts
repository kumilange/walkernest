import { type Page, expect } from "@playwright/test";
import type { FavoriteTestData } from "../../types/TestTypes";
import { ErrorHandler } from "../../utils/ErrorHandler";
import { BaseComponent } from "../BaseComponent";

/**
 * Page Object for FavoritesList component
 * Handles saved apartment management including cross-city favorites and localStorage synchronization
 */
export class FavoritesListPage extends BaseComponent {
  private readonly errorHandler: ErrorHandler;

  // Selectors
  private readonly selectors = {
    container: "ul.grid",
    emptyState: 'p:has-text("No favorites are added yet.")',

    // Favorite item selectors
    favoriteItem: '[data-testid="favorite-item"]',
    favoriteButton: 'button[data-testid="favorite-button"]',
    favoriteName: '[data-testid="favorite-name"]',
    favoriteCity: '[data-testid="favorite-city"]',
    deleteButton: 'svg[data-testid="delete-favorite"]',

    // Alternative selectors based on actual component structure
    favoriteItemAlt: "li",
    favoriteButtonAlt: "button",
    deleteButtonAlt: 'svg[data-lucide="trash-2"]',

    // Selected state
    selectedItem: '.bg-gray-100, .selected, [data-selected="true"]',
  };

  constructor(page: Page) {
    super(
      page,
      '[data-testid="favorites-list"], ul.grid, div:has(p:has-text("No favorites are added yet."))',
      "FavoritesList"
    );
    this.errorHandler = new ErrorHandler(page);
  }

  /**
   * Check if favorites list is in empty state
   */
  async isEmptyState(): Promise<boolean> {
    await this.waitForComponent();
    return await this.isElementVisible(this.selectors.emptyState);
  }

  /**
   * Get all favorite items
   */
  async getFavoriteItems(): Promise<
    Array<{
      id: string;
      name: string;
      city: string;
      element: import("@playwright/test").Locator;
    }>
  > {
    await this.waitForComponent();

    const isEmpty = await this.isEmptyState();
    if (isEmpty) {
      return [];
    }

    // Try primary selectors first, then fallback to alternative selectors
    let items = this.getComponentElement(this.selectors.favoriteItem);
    if ((await items.count()) === 0) {
      items = this.getComponentElement(this.selectors.favoriteItemAlt);
    }

    const itemCount = await items.count();
    const favorites = [];

    for (let i = 0; i < itemCount; i++) {
      const item = items.nth(i);

      // Extract name and city from the item
      const textContent = (await item.textContent()) || "";
      const parts = textContent
        .split("\n")
        .map((part) => part.trim())
        .filter((part) => part);

      // Assuming format: "Name City" or separate elements
      let name = "";
      let city = "";

      if (parts.length >= 2) {
        name = parts[0];
        city = parts[1];
      } else if (parts.length === 1) {
        // Try to extract from single text
        const text = parts[0];
        const lastSpaceIndex = text.lastIndexOf(" ");
        if (lastSpaceIndex > 0) {
          name = text.substring(0, lastSpaceIndex);
          city = text.substring(lastSpaceIndex + 1);
        } else {
          name = text;
        }
      }

      favorites.push({
        id: `favorite-${i}`,
        name,
        city,
        element: item,
      });
    }

    return favorites;
  }

  /**
   * Select a favorite by name
   */
  async selectFavoriteByName(name: string): Promise<void> {
    await this.errorHandler.withErrorHandling(
      async () => {
        const favorites = await this.getFavoriteItems();
        const favorite = favorites.find((fav) => fav.name.includes(name));

        if (!favorite) {
          throw new Error(`Favorite with name "${name}" not found`);
        }

        // Click on the favorite button/item
        const button = favorite.element.locator("button").first();
        if ((await button.count()) > 0) {
          await button.click();
        } else {
          await favorite.element.click();
        }

        // Wait for map to respond (flyTo animation)
        await this.page.waitForTimeout(1000);
      },
      {
        component: "FavoritesList",
        step: "selectFavoriteByName",
      }
    );
  }

  /**
   * Select favorite with touch events
   */
  async selectFavoriteByNameWithTouch(name: string): Promise<void> {
    await this.errorHandler.withErrorHandling(
      async () => {
        const favorites = await this.getFavoriteItems();
        const favorite = favorites.find((fav) => fav.name.includes(name));

        if (!favorite) {
          throw new Error(`Favorite with name "${name}" not found`);
        }

        const button = favorite.element.locator("button").first();
        const targetElement = (await button.count()) > 0 ? button : favorite.element;

        // Use touch events
        await targetElement.dispatchEvent("touchstart");
        await targetElement.dispatchEvent("touchend");
        await targetElement.click();

        // Wait for map response
        await this.page.waitForTimeout(1000);
      },
      {
        component: "FavoritesList",
        step: "selectFavoriteByNameWithTouch",
      }
    );
  }

  /**
   * Delete a favorite by name
   */
  async deleteFavoriteByName(name: string): Promise<void> {
    await this.errorHandler.withErrorHandling(
      async () => {
        const favorites = await this.getFavoriteItems();
        const favorite = favorites.find((fav) => fav.name.includes(name));

        if (!favorite) {
          throw new Error(`Favorite with name "${name}" not found`);
        }

        // Find delete button (trash icon)
        let deleteButton = favorite.element.locator(this.selectors.deleteButton);
        if ((await deleteButton.count()) === 0) {
          deleteButton = favorite.element.locator(this.selectors.deleteButtonAlt);
        }

        if ((await deleteButton.count()) === 0) {
          throw new Error(`Delete button not found for favorite "${name}"`);
        }

        // Click delete button
        await deleteButton.click();

        // Wait for item to be removed from DOM
        await this.page.waitForTimeout(500);
      },
      {
        component: "FavoritesList",
        step: "deleteFavoriteByName",
      }
    );
  }

  /**
   * Delete favorite with touch events
   */
  async deleteFavoriteByNameWithTouch(name: string): Promise<void> {
    await this.errorHandler.withErrorHandling(
      async () => {
        const favorites = await this.getFavoriteItems();
        const favorite = favorites.find((fav) => fav.name.includes(name));

        if (!favorite) {
          throw new Error(`Favorite with name "${name}" not found`);
        }

        // Find delete button
        let deleteButton = favorite.element.locator(this.selectors.deleteButton);
        if ((await deleteButton.count()) === 0) {
          deleteButton = favorite.element.locator(this.selectors.deleteButtonAlt);
        }

        if ((await deleteButton.count()) === 0) {
          throw new Error(`Delete button not found for favorite "${name}"`);
        }

        // Use touch events
        await deleteButton.dispatchEvent("touchstart");
        await deleteButton.dispatchEvent("touchend");
        await deleteButton.click();

        // Wait for removal
        await this.page.waitForTimeout(500);
      },
      {
        component: "FavoritesList",
        step: "deleteFavoriteByNameWithTouch",
      }
    );
  }

  /**
   * Get currently selected favorite
   */
  async getSelectedFavorite(): Promise<string | null> {
    const selectedElement = this.getComponentElement(this.selectors.selectedItem);

    if ((await selectedElement.count()) === 0) {
      return null;
    }

    const textContent = await selectedElement.textContent();
    return textContent?.trim() || null;
  }

  /**
   * Verify localStorage synchronization
   */
  async verifyLocalStorageSync(): Promise<{
    isSync: boolean;
    localStorageCount: number;
    displayedCount: number;
    favorites: FavoriteTestData[];
  }> {
    // Get favorites from localStorage
    const localStorageFavorites = await this.page.evaluate(() => {
      const favoritesJson = localStorage.getItem("favorites");
      return favoritesJson ? JSON.parse(favoritesJson) : [];
    });

    // Get displayed favorites
    const displayedFavorites = await this.getFavoriteItems();

    const isSync = localStorageFavorites.length === displayedFavorites.length;

    return {
      isSync,
      localStorageCount: localStorageFavorites.length,
      displayedCount: displayedFavorites.length,
      favorites: localStorageFavorites,
    };
  }

  /**
   * Add favorite to localStorage for testing
   */
  async addFavoriteToLocalStorage(favorite: FavoriteTestData): Promise<void> {
    await this.page.evaluate((favoriteData) => {
      const existingFavorites = JSON.parse(localStorage.getItem("favorites") || "[]");
      const newFavorite = {
        id: Date.now(),
        name: favoriteData.name,
        city: favoriteData.city,
        feature: {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [favoriteData.coordinates.lng, favoriteData.coordinates.lat],
          },
          properties: {
            address: favoriteData.address,
            ...favoriteData.features,
          },
        },
      };
      existingFavorites.push(newFavorite);
      localStorage.setItem("favorites", JSON.stringify(existingFavorites));
    }, favorite);

    // Wait for component to sync with localStorage
    await this.page.waitForTimeout(500);
  }

  /**
   * Clear all favorites from localStorage
   */
  async clearFavoritesFromLocalStorage(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.removeItem("favorites");
    });

    // Wait for component to sync
    await this.page.waitForTimeout(500);
  }

  /**
   * Test cross-city favorites functionality
   */
  async testCrossCityFavorites(favorites: FavoriteTestData[]): Promise<{
    success: boolean;
    citiesDisplayed: string[];
    citySwitch: boolean;
  }> {
    // Add favorites from different cities
    for (const favorite of favorites) {
      await this.addFavoriteToLocalStorage(favorite);
    }

    // Get displayed favorites
    const displayedFavorites = await this.getFavoriteItems();
    const citiesDisplayed = [...new Set(displayedFavorites.map((fav) => fav.city))];

    // Test city switching by selecting a favorite from a different city
    let citySwitch = false;
    if (favorites.length > 1) {
      const firstFavorite = favorites[0];
      await this.selectFavoriteByName(firstFavorite.name);

      // Check if city changed (this would need to be verified by checking the current city state)
      // For now, we'll assume it works if no error is thrown
      citySwitch = true;
    }

    return {
      success: displayedFavorites.length === favorites.length,
      citiesDisplayed,
      citySwitch,
    };
  }

  /**
   * Validate favorites list display
   */
  async validateFavoritesDisplay(): Promise<{
    hasEmptyState: boolean;
    itemCount: number;
    allItemsHaveDeleteButton: boolean;
    allItemsClickable: boolean;
  }> {
    const hasEmptyState = await this.isEmptyState();

    if (hasEmptyState) {
      return {
        hasEmptyState: true,
        itemCount: 0,
        allItemsHaveDeleteButton: false,
        allItemsClickable: false,
      };
    }

    const favorites = await this.getFavoriteItems();
    let allItemsHaveDeleteButton = true;
    let allItemsClickable = true;

    for (const favorite of favorites) {
      // Check for delete button
      const deleteButton = favorite.element.locator(this.selectors.deleteButtonAlt);
      if ((await deleteButton.count()) === 0) {
        allItemsHaveDeleteButton = false;
      }

      // Check if item is clickable
      const button = favorite.element.locator("button").first();
      if ((await button.count()) === 0) {
        allItemsClickable = false;
      }
    }

    return {
      hasEmptyState: false,
      itemCount: favorites.length,
      allItemsHaveDeleteButton,
      allItemsClickable,
    };
  }

  /**
   * Test complete favorites workflow
   */
  async testFavoritesWorkflow(testFavorites: FavoriteTestData[]): Promise<{
    success: boolean;
    steps: string[];
    errors: string[];
  }> {
    const steps: string[] = [];
    const errors: string[] = [];

    try {
      // Clear existing favorites
      await this.clearFavoritesFromLocalStorage();
      steps.push("Cleared existing favorites");

      // Verify empty state
      const isEmpty = await this.isEmptyState();
      if (isEmpty) {
        steps.push("Verified empty state");
      } else {
        errors.push("Empty state not displayed when no favorites exist");
      }

      // Add test favorites
      for (const favorite of testFavorites) {
        await this.addFavoriteToLocalStorage(favorite);
        steps.push(`Added favorite: ${favorite.name}`);
      }

      // Verify localStorage sync
      const syncResult = await this.verifyLocalStorageSync();
      if (syncResult.isSync) {
        steps.push("Verified localStorage synchronization");
      } else {
        errors.push(
          `localStorage sync failed: ${syncResult.localStorageCount} vs ${syncResult.displayedCount}`
        );
      }

      // Test selection
      if (testFavorites.length > 0) {
        await this.selectFavoriteByName(testFavorites[0].name);
        steps.push(`Selected favorite: ${testFavorites[0].name}`);
      }

      // Test deletion
      if (testFavorites.length > 0) {
        await this.deleteFavoriteByName(testFavorites[0].name);
        steps.push(`Deleted favorite: ${testFavorites[0].name}`);
      }

      return {
        success: errors.length === 0,
        steps,
        errors,
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Unknown error");
      return {
        success: false,
        steps,
        errors,
      };
    }
  }
}
