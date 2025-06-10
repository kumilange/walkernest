import { type Page, expect } from "@playwright/test";
import type { CoordinateTestData } from "../../types/TestTypes";
import { ErrorHandler } from "../../utils/ErrorHandler";
import { BaseComponent } from "../BaseComponent";

/**
 * Page Object for NameFavoritePopup component
 * Handles favorite naming dialog with form validation and submission
 */
export class NameFavoritePopupPage extends BaseComponent {
  private readonly errorHandler: ErrorHandler;

  // Selectors
  private readonly selectors = {
    popup: ".maplibregl-popup.favorite",
    popupContent: ".maplibregl-popup-content",

    // Form elements
    form: "form",
    nameInput: 'input[name="favorite"]',
    nameLabel: 'label:has-text("Name your favorite item")',

    // Buttons
    cancelButton: 'button:has-text("Cancel")',
    saveButton: 'button:has-text("Save")',
    closeButton: 'button:has(svg[data-lucide="x"])',

    // Form validation
    errorMessage: '[role="alert"]',
    formMessage: ".text-sm.font-medium.text-destructive",

    // States
    disabledSaveButton: 'button:has-text("Save"):disabled',
    enabledSaveButton: 'button:has-text("Save"):not(:disabled)',

    // Animation
    fadeInAnimation: ".animate-fade-in",

    // Popup positioning
    popupAnchor: ".maplibregl-popup-anchor-bottom",
  };

  constructor(page: Page) {
    super(
      page,
      '.maplibregl-popup.favorite, [data-testid="name-favorite-popup"]',
      "NameFavoritePopup"
    );
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
   * Enter favorite name
   */
  async enterFavoriteName(name: string): Promise<void> {
    await this.errorHandler.withErrorHandling(
      async () => {
        await this.waitForPopup();

        const nameInput = this.page.locator(this.selectors.nameInput);
        await nameInput.clear();
        await nameInput.fill(name);

        // Verify the value was set
        await expect(nameInput).toHaveValue(name);
      },
      {
        component: "NameFavoritePopup",
        step: "enterFavoriteName",
      }
    );
  }

  /**
   * Get current input value
   */
  async getCurrentName(): Promise<string> {
    await this.waitForPopup();
    const nameInput = this.page.locator(this.selectors.nameInput);
    return await nameInput.inputValue();
  }

  /**
   * Check if save button is enabled
   */
  async isSaveButtonEnabled(): Promise<boolean> {
    const enabledButton = this.page.locator(this.selectors.enabledSaveButton);
    return (await enabledButton.count()) > 0;
  }

  /**
   * Check if save button is disabled
   */
  async isSaveButtonDisabled(): Promise<boolean> {
    const disabledButton = this.page.locator(this.selectors.disabledSaveButton);
    return (await disabledButton.count()) > 0;
  }

  /**
   * Save favorite
   */
  async saveFavorite(): Promise<void> {
    await this.errorHandler.withErrorHandling(
      async () => {
        await this.waitForPopup();

        const saveButton = this.page.locator(this.selectors.saveButton);

        // Verify save button is enabled
        await expect(saveButton).toBeEnabled();

        // Click save button
        await saveButton.click();

        // Wait for popup to disappear (successful save)
        await this.page.waitForSelector(this.selectors.popup, {
          state: "hidden",
          timeout: 5000,
        });
      },
      {
        component: "NameFavoritePopup",
        step: "saveFavorite",
      }
    );
  }

  /**
   * Cancel favorite naming
   */
  async cancelFavorite(): Promise<void> {
    await this.errorHandler.withErrorHandling(
      async () => {
        await this.waitForPopup();

        const cancelButton = this.page.locator(this.selectors.cancelButton);
        await cancelButton.click();

        // Wait for popup to disappear
        await this.page.waitForSelector(this.selectors.popup, {
          state: "hidden",
          timeout: 2000,
        });
      },
      {
        component: "NameFavoritePopup",
        step: "cancelFavorite",
      }
    );
  }

  /**
   * Cancel with touch events
   */
  async cancelFavoriteWithTouch(): Promise<void> {
    await this.errorHandler.withErrorHandling(
      async () => {
        await this.waitForPopup();

        const cancelButton = this.page.locator(this.selectors.cancelButton);

        // Use touch events
        await cancelButton.dispatchEvent("touchstart");
        await cancelButton.dispatchEvent("touchend");
        await cancelButton.click();

        // Wait for popup to disappear
        await this.page.waitForSelector(this.selectors.popup, {
          state: "hidden",
          timeout: 2000,
        });
      },
      {
        component: "NameFavoritePopup",
        step: "cancelFavoriteWithTouch",
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
        await closeButton.click();

        // Wait for popup to disappear
        await this.page.waitForSelector(this.selectors.popup, {
          state: "hidden",
          timeout: 2000,
        });
      },
      {
        component: "NameFavoritePopup",
        step: "closePopup",
      }
    );
  }

  /**
   * Get form validation state
   */
  async getFormValidationState(): Promise<{
    isValid: boolean;
    hasName: boolean;
    nameLength: number;
    saveEnabled: boolean;
    errorMessage?: string;
  }> {
    await this.waitForPopup();

    const currentName = await this.getCurrentName();
    const hasName = currentName.trim().length > 0;
    const nameLength = currentName.length;
    const saveEnabled = await this.isSaveButtonEnabled();

    // Check for error messages
    let errorMessage: string | undefined;
    const errorElement = this.page.locator(this.selectors.errorMessage);
    if ((await errorElement.count()) > 0) {
      errorMessage = (await errorElement.textContent()) || undefined;
    }

    const isValid = hasName && saveEnabled && !errorMessage;

    return {
      isValid,
      hasName,
      nameLength,
      saveEnabled,
      errorMessage,
    };
  }

  /**
   * Test form validation with different inputs
   */
  async testFormValidation(): Promise<{
    emptyNameValid: boolean;
    shortNameValid: boolean;
    normalNameValid: boolean;
    longNameValid: boolean;
  }> {
    await this.waitForPopup();

    // Test empty name
    await this.enterFavoriteName("");
    const emptyState = await this.getFormValidationState();
    const emptyNameValid = !emptyState.isValid;

    // Test short name
    await this.enterFavoriteName("A");
    const shortState = await this.getFormValidationState();
    const shortNameValid = shortState.isValid;

    // Test normal name
    await this.enterFavoriteName("My Favorite Apartment");
    const normalState = await this.getFormValidationState();
    const normalNameValid = normalState.isValid;

    // Test very long name
    await this.enterFavoriteName("A".repeat(100));
    const longState = await this.getFormValidationState();
    const longNameValid = longState.isValid;

    return {
      emptyNameValid,
      shortNameValid,
      normalNameValid,
      longNameValid,
    };
  }

  /**
   * Get default name if pre-filled
   */
  async getDefaultName(): Promise<string> {
    await this.waitForPopup();

    // The default name should be pre-filled in the input
    return await this.getCurrentName();
  }

  /**
   * Verify popup positioning
   */
  async verifyPopupPositioning(expectedCoordinates: CoordinateTestData): Promise<{
    isPositioned: boolean;
    popupPosition: { x: number; y: number } | null;
  }> {
    const popup = this.page.locator(this.selectors.popup);
    const boundingBox = await popup.boundingBox();

    const popupPosition = boundingBox ? { x: boundingBox.x, y: boundingBox.y } : null;
    const isPositioned = popupPosition !== null && popupPosition.x > 0 && popupPosition.y > 0;

    return {
      isPositioned,
      popupPosition,
    };
  }

  /**
   * Test complete favorite naming workflow
   */
  async completeFavoriteNamingWorkflow(favoriteName: string): Promise<{
    success: boolean;
    duration: number;
    defaultName: string;
    finalName: string;
    saved: boolean;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      // Wait for popup to appear
      await this.waitForPopup();

      // Get default name
      const defaultName = await this.getDefaultName();

      // Enter favorite name
      await this.enterFavoriteName(favoriteName);

      // Verify form validation
      const validationState = await this.getFormValidationState();
      if (!validationState.isValid) {
        throw new Error(
          `Form validation failed: ${validationState.errorMessage || "Invalid input"}`
        );
      }

      // Save favorite
      await this.saveFavorite();

      const duration = Date.now() - startTime;
      const finalName = favoriteName;

      return {
        success: true,
        duration,
        defaultName,
        finalName,
        saved: true,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        duration,
        defaultName: "",
        finalName: "",
        saved: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Test touch event support
   */
  async testTouchEventSupport(): Promise<{
    cancelTouchSupport: boolean;
    saveTouchSupport: boolean;
    closeTouchSupport: boolean;
  }> {
    await this.waitForPopup();

    // Test cancel button touch support
    let cancelTouchSupport = false;
    const cancelButton = this.page.locator(this.selectors.cancelButton);
    if ((await cancelButton.count()) > 0) {
      try {
        await cancelButton.dispatchEvent("touchstart");
        await cancelButton.dispatchEvent("touchend");
        cancelTouchSupport = true;
      } catch {
        cancelTouchSupport = false;
      }
    }

    // Test save button touch support
    let saveTouchSupport = false;
    const saveButton = this.page.locator(this.selectors.saveButton);
    if ((await saveButton.count()) > 0) {
      try {
        await saveButton.dispatchEvent("touchstart");
        await saveButton.dispatchEvent("touchend");
        saveTouchSupport = true;
      } catch {
        saveTouchSupport = false;
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
      cancelTouchSupport,
      saveTouchSupport,
      closeTouchSupport,
    };
  }

  /**
   * Validate popup structure
   */
  async validatePopupStructure(): Promise<{
    hasForm: boolean;
    hasNameInput: boolean;
    hasLabel: boolean;
    hasCancelButton: boolean;
    hasSaveButton: boolean;
    hasCloseButton: boolean;
    hasAnimation: boolean;
  }> {
    await this.waitForPopup();

    const hasForm = await this.isElementVisible(this.selectors.form);
    const hasNameInput = await this.isElementVisible(this.selectors.nameInput);
    const hasLabel = await this.isElementVisible(this.selectors.nameLabel);
    const hasCancelButton = await this.isElementVisible(this.selectors.cancelButton);
    const hasSaveButton = await this.isElementVisible(this.selectors.saveButton);
    const hasCloseButton = await this.isElementVisible(this.selectors.closeButton);
    const hasAnimation = await this.isElementVisible(this.selectors.fadeInAnimation);

    return {
      hasForm,
      hasNameInput,
      hasLabel,
      hasCancelButton,
      hasSaveButton,
      hasCloseButton,
      hasAnimation,
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
   * Check if popup has animation
   */
  async hasAnimation(): Promise<boolean> {
    return await this.isElementVisible(this.selectors.fadeInAnimation);
  }
}
