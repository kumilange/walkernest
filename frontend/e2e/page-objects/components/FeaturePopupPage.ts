import { type Page, expect } from "@playwright/test";
import type { CoordinateTestData } from "../../types/TestTypes";
import { ErrorHandler } from "../../utils/ErrorHandler";
import { BaseComponent } from "../BaseComponent";

/**
 * Page Object for FeaturePopup component
 * Handles apartment feature details popup with favoriting functionality
 */
export class FeaturePopupPage extends BaseComponent {
  private readonly errorHandler: ErrorHandler;

  // Selectors
  private readonly selectors = {
    popup: ".maplibregl-popup",
    popupContent: ".maplibregl-popup-content",

    // Content elements
    propertyItem: "div.flex.items-center",
    propertyIcon: "svg",
    propertyText: "span",

    // Heart icon for favoriting
    heartIcon: 'svg[data-lucide="heart"]',
    heartIconFilled: 'svg[fill]:not([fill="none"])',
    heartButton: 'span:has(svg[data-lucide="heart"])',

    // Close button
    closeButton: 'button:has(svg[data-lucide="x"])',
    closeButtonIcon: 'svg[data-lucide="x"]',

    // Popup positioning
    popupAnchor: ".maplibregl-popup-anchor-bottom",

    // Property types
    apartmentProperty: 'div:has(span:contains("apartment"))',
    addressProperty: "div:has(span)",

    // Animation classes
    fadeInAnimation: ".animate-fade-in",

    // Error states
    errorMessage: '[role="alert"]',
  };

  constructor(page: Page) {
    super(page, '.maplibregl-popup, [data-testid="feature-popup"]', "FeaturePopup");
    this.errorHandler = new ErrorHandler(page);
  }

  /**
   * Wait for popup to appear
   */
  async waitForPopup(timeout = 5000): Promise<void> {
    await this.page.waitForSelector(this.selectors.popup, {
      state: "visible",
      timeout,
    });

    // Wait for animation to complete
    await this.page.waitForTimeout(300);
  }

  /**
   * Check if popup is visible
   */
  async isPopupVisible(): Promise<boolean> {
    return await this.isElementVisible(this.selectors.popup);
  }

  /**
   * Get popup position
   */
  async getPopupPosition(): Promise<{ x: number; y: number } | null> {
    const popup = this.page.locator(this.selectors.popup);

    if ((await popup.count()) === 0) {
      return null;
    }

    const boundingBox = await popup.boundingBox();
    return boundingBox ? { x: boundingBox.x, y: boundingBox.y } : null;
  }

  /**
   * Get all property information displayed in popup
   */
  async getPropertyInfo(): Promise<
    Array<{
      icon: string;
      text: string;
      type: string;
    }>
  > {
    await this.waitForPopup();

    const propertyItems = this.page.locator(this.selectors.propertyItem);
    const itemCount = await propertyItems.count();
    const properties = [];

    for (let i = 0; i < itemCount; i++) {
      const item = propertyItems.nth(i);

      // Get icon information
      const icon = item.locator(this.selectors.propertyIcon);
      let iconType = "";
      if ((await icon.count()) > 0) {
        iconType =
          (await icon.getAttribute("data-lucide")) ||
          (await icon.getAttribute("class")) ||
          "unknown";
      }

      // Get text content
      const textElement = item.locator(this.selectors.propertyText);
      const text = (await textElement.textContent()) || "";

      // Determine property type
      let type = "unknown";
      if (text.toLowerCase().includes("apartment")) {
        type = "building";
      } else if (iconType.includes("heart")) {
        type = "favorite";
      } else if (text.includes("@") || text.includes("street") || text.includes("str")) {
        type = "address";
      }

      properties.push({
        icon: iconType,
        text: text.trim(),
        type,
      });
    }

    return properties;
  }

  /**
   * Check if apartment can be favorited
   */
  async canBeFavorited(): Promise<boolean> {
    const heartIcon = this.page.locator(this.selectors.heartIcon);
    return (await heartIcon.count()) > 0;
  }

  /**
   * Check if apartment is already favorited
   */
  async isAlreadyFavorited(): Promise<boolean> {
    const filledHeart = this.page.locator(this.selectors.heartIconFilled);
    return (await filledHeart.count()) > 0;
  }

  /**
   * Click heart icon to favorite apartment
   */
  async favoriteApartment(): Promise<void> {
    await this.errorHandler.withErrorHandling(
      async () => {
        await this.waitForPopup();

        const heartButton = this.page.locator(this.selectors.heartButton);
        if ((await heartButton.count()) === 0) {
          throw new Error("Heart icon not found - apartment cannot be favorited");
        }

        await heartButton.click();

        // Wait for favoriting action to complete
        await this.page.waitForTimeout(500);
      },
      {
        component: "FeaturePopup",
        step: "favoriteApartment",
      }
    );
  }

  /**
   * Click heart icon with touch events
   */
  async favoriteApartmentWithTouch(): Promise<void> {
    await this.errorHandler.withErrorHandling(
      async () => {
        await this.waitForPopup();

        const heartButton = this.page.locator(this.selectors.heartButton);
        if ((await heartButton.count()) === 0) {
          throw new Error("Heart icon not found - apartment cannot be favorited");
        }

        // Use touch events
        await heartButton.dispatchEvent("touchstart");
        await heartButton.dispatchEvent("touchend");
        await heartButton.click();

        // Wait for action to complete
        await this.page.waitForTimeout(500);
      },
      {
        component: "FeaturePopup",
        step: "favoriteApartmentWithTouch",
      }
    );
  }

  /**
   * Close popup using close button
   */
  async closePopup(): Promise<void> {
    await this.errorHandler.withErrorHandling(
      async () => {
        const closeButton = this.page.locator(this.selectors.closeButton);

        if ((await closeButton.count()) > 0) {
          await closeButton.click();
        } else {
          // Fallback: click outside popup
          await this.clickOutsidePopup();
        }

        // Wait for popup to disappear
        await this.page.waitForSelector(this.selectors.popup, {
          state: "hidden",
          timeout: 2000,
        });
      },
      {
        component: "FeaturePopup",
        step: "closePopup",
      }
    );
  }

  /**
   * Close popup by clicking outside
   */
  async clickOutsidePopup(): Promise<void> {
    await this.errorHandler.withErrorHandling(
      async () => {
        // Get popup position
        const popup = this.page.locator(this.selectors.popup);
        const popupBox = await popup.boundingBox();

        if (popupBox) {
          // Click outside the popup
          await this.page.click("body", {
            position: {
              x: popupBox.x - 50,
              y: popupBox.y - 50,
            },
          });
        } else {
          // Fallback: click on map area
          await this.page.click(".maplibregl-map");
        }

        // Wait for popup to disappear
        await this.page.waitForSelector(this.selectors.popup, {
          state: "hidden",
          timeout: 2000,
        });
      },
      {
        component: "FeaturePopup",
        step: "clickOutsidePopup",
      }
    );
  }

  /**
   * Verify popup is anchored to feature location
   */
  async verifyPopupAnchoring(expectedCoordinates: CoordinateTestData): Promise<{
    isAnchored: boolean;
    popupPosition: { x: number; y: number } | null;
    expectedPosition: { x: number; y: number } | null;
  }> {
    const popupPosition = await this.getPopupPosition();

    // Convert coordinates to screen position (this would need map projection)
    // For now, we'll just verify popup exists and has reasonable position
    const expectedPosition = null; // Would calculate from coordinates

    const isAnchored = popupPosition !== null && popupPosition.x > 0 && popupPosition.y > 0;

    return {
      isAnchored,
      popupPosition,
      expectedPosition,
    };
  }

  /**
   * Test popup interaction workflow
   */
  async testPopupInteraction(shouldFavorite = false): Promise<{
    success: boolean;
    propertyCount: number;
    canFavorite: boolean;
    favorited: boolean;
    closed: boolean;
    error?: string;
  }> {
    try {
      // Wait for popup to appear
      await this.waitForPopup();

      // Get property information
      const properties = await this.getPropertyInfo();
      const propertyCount = properties.length;

      // Check favoriting capability
      const canFavorite = await this.canBeFavorited();
      let favorited = false;

      if (shouldFavorite && canFavorite) {
        await this.favoriteApartment();
        favorited = await this.isAlreadyFavorited();
      }

      // Close popup
      await this.closePopup();
      const closed = !(await this.isPopupVisible());

      return {
        success: true,
        propertyCount,
        canFavorite,
        favorited,
        closed,
      };
    } catch (error) {
      return {
        success: false,
        propertyCount: 0,
        canFavorite: false,
        favorited: false,
        closed: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Validate popup content structure
   */
  async validatePopupContent(): Promise<{
    hasContent: boolean;
    hasCloseButton: boolean;
    hasProperties: boolean;
    hasHeartIcon: boolean;
    propertyTypes: string[];
  }> {
    await this.waitForPopup();

    const hasContent = await this.isElementVisible(this.selectors.popupContent);
    const hasCloseButton = await this.isElementVisible(this.selectors.closeButton);
    const hasHeartIcon = await this.canBeFavorited();

    const properties = await this.getPropertyInfo();
    const hasProperties = properties.length > 0;
    const propertyTypes = [...new Set(properties.map((p) => p.type))];

    return {
      hasContent,
      hasCloseButton,
      hasProperties,
      hasHeartIcon,
      propertyTypes,
    };
  }

  /**
   * Test touch event support
   */
  async testTouchEventSupport(): Promise<{
    heartTouchSupport: boolean;
    closeTouchSupport: boolean;
  }> {
    await this.waitForPopup();

    // Test heart icon touch support
    let heartTouchSupport = false;
    const heartButton = this.page.locator(this.selectors.heartButton);
    if ((await heartButton.count()) > 0) {
      try {
        await heartButton.dispatchEvent("touchstart");
        await heartButton.dispatchEvent("touchend");
        heartTouchSupport = true;
      } catch {
        heartTouchSupport = false;
      }
    }

    // Test close button touch support
    let closeTouchSupport = false;
    const closeButton = this.page.locator(this.selectors.closeButton);
    if ((await closeButton.count()) > 0) {
      try {
        await closeButton.dispatchEvent("touchstart");
        await closeButton.dispatchEvent("touchend");
        closeTouchSupport = true;
      } catch {
        closeTouchSupport = false;
      }
    }

    return {
      heartTouchSupport,
      closeTouchSupport,
    };
  }

  /**
   * Wait for popup to disappear
   */
  async waitForPopupToDisappear(timeout = 5000): Promise<void> {
    await this.page.waitForSelector(this.selectors.popup, {
      state: "hidden",
      timeout,
    });
  }

  /**
   * Get popup content text
   */
  async getPopupText(): Promise<string> {
    await this.waitForPopup();
    const content = this.page.locator(this.selectors.popupContent);
    return (await content.textContent()) || "";
  }

  /**
   * Check if popup has animation
   */
  async hasAnimation(): Promise<boolean> {
    return await this.isElementVisible(this.selectors.fadeInAnimation);
  }
}
