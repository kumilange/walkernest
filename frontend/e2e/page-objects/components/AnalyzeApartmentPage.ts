import { type Page, expect } from "@playwright/test";
import type { WalkingDistanceData } from "../../types/TestTypes";
import { ErrorHandler } from "../../utils/ErrorHandler";
import { BaseComponent } from "../BaseComponent";

/**
 * Page Object for AnalyzeApartment component
 * Handles walking distance analysis form with validation, submission, and touch events
 */
export class AnalyzeApartmentPage extends BaseComponent {
  private readonly errorHandler: ErrorHandler;

  // Selectors
  private readonly selectors = {
    form: "form",
    walkingDistanceTitle: 'h3:has-text("Walking Distance")',

    // Form fields
    parkInput: 'input[id="park"]',
    supermarketInput: 'input[id="supermarket"]',
    cafeInput: 'input[id="cafe"]',

    // Checkboxes
    parkCheckbox: 'input[id="parkCheckbox"]',
    supermarketCheckbox: 'input[id="supermarketCheckbox"]',
    cafeCheckbox: 'input[id="cafeCheckbox"]',

    // Buttons
    closeButton: 'button:has-text("Close")',
    analyzeButton: 'button:has-text("Analyze")',

    // Progress dialog
    progressDialog: '[role="dialog"]',
    progressBar: '[role="progressbar"]',

    // Error states
    errorMessage: '[role="alert"]',
    retryButton: 'button:has-text("Try again")',
  };

  constructor(page: Page) {
    super(
      page,
      '[data-testid="analyze-apartment"], form:has(h3:has-text("Walking Distance"))',
      "AnalyzeApartment"
    );
    this.errorHandler = new ErrorHandler(page);
  }

  /**
   * Fill walking distance form with provided data
   */
  async fillWalkingDistances(data: WalkingDistanceData): Promise<void> {
    await this.errorHandler.withErrorHandling(
      async () => {
        await this.waitForComponent();

        // Enable checkboxes first
        await this.enableAllAmenities();

        // Fill the form fields
        await this.typeInComponentInput(this.selectors.parkInput, data.park.toString(), {
          clear: true,
        });
        await this.typeInComponentInput(
          this.selectors.supermarketInput,
          data.supermarket.toString(),
          { clear: true }
        );
        await this.typeInComponentInput(this.selectors.cafeInput, data.cafe.toString(), {
          clear: true,
        });

        // Verify values were set correctly
        await expect(this.getComponentElement(this.selectors.parkInput)).toHaveValue(
          data.park.toString()
        );
        await expect(this.getComponentElement(this.selectors.supermarketInput)).toHaveValue(
          data.supermarket.toString()
        );
        await expect(this.getComponentElement(this.selectors.cafeInput)).toHaveValue(
          data.cafe.toString()
        );
      },
      {
        component: "AnalyzeApartment",
        step: "fillWalkingDistances",
      }
    );
  }

  /**
   * Enable all amenity checkboxes
   */
  async enableAllAmenities(): Promise<void> {
    const checkboxes = [
      this.selectors.parkCheckbox,
      this.selectors.supermarketCheckbox,
      this.selectors.cafeCheckbox,
    ];

    for (const checkbox of checkboxes) {
      const checkboxElement = this.getComponentElement(checkbox);
      const isChecked = await checkboxElement.isChecked();
      if (!isChecked) {
        await checkboxElement.check();
      }
    }
  }

  /**
   * Check if submit button is enabled
   */
  async isSubmitEnabled(): Promise<boolean> {
    const submitButton = this.getComponentElement(this.selectors.analyzeButton);
    return await submitButton.isEnabled();
  }

  /**
   * Check form validation state
   */
  async validateFormState(): Promise<{
    isValid: boolean;
    enabledFields: string[];
    filledFields: string[];
    submitEnabled: boolean;
  }> {
    const fields = [
      { name: "park", selector: this.selectors.parkInput },
      { name: "supermarket", selector: this.selectors.supermarketInput },
      { name: "cafe", selector: this.selectors.cafeInput },
    ];

    const enabledFields: string[] = [];
    const filledFields: string[] = [];

    for (const field of fields) {
      const element = this.getComponentElement(field.selector);

      if (await element.isEnabled()) {
        enabledFields.push(field.name);
      }

      const value = await element.inputValue();
      if (value && value.trim() !== "") {
        filledFields.push(field.name);
      }
    }

    const submitEnabled = await this.isSubmitEnabled();
    const isValid = filledFields.length === 3 && submitEnabled;

    return {
      isValid,
      enabledFields,
      filledFields,
      submitEnabled,
    };
  }

  /**
   * Submit the analysis form
   */
  async submitAnalysis(): Promise<void> {
    await this.errorHandler.withErrorHandling(
      async () => {
        const submitButton = this.getComponentElement(this.selectors.analyzeButton);

        // Verify submit button is enabled
        await expect(submitButton).toBeEnabled();

        // Click submit button
        await submitButton.click();

        // Wait for progress dialog to appear
        await this.page.waitForSelector(this.selectors.progressDialog, {
          state: "visible",
          timeout: 5000,
        });
      },
      {
        component: "AnalyzeApartment",
        step: "submitAnalysis",
      }
    );
  }

  /**
   * Submit analysis with touch events
   */
  async submitAnalysisWithTouch(): Promise<void> {
    await this.errorHandler.withErrorHandling(
      async () => {
        const submitButton = this.getComponentElement(this.selectors.analyzeButton);

        // Verify submit button is enabled
        await expect(submitButton).toBeEnabled();

        // Use touch events
        await submitButton.dispatchEvent("touchstart");
        await submitButton.dispatchEvent("touchend");
        await submitButton.click();

        // Wait for progress dialog
        await this.page.waitForSelector(this.selectors.progressDialog, {
          state: "visible",
          timeout: 5000,
        });
      },
      {
        component: "AnalyzeApartment",
        step: "submitAnalysisWithTouch",
      }
    );
  }

  /**
   * Close the form
   */
  async closeForm(): Promise<void> {
    await this.errorHandler.withErrorHandling(
      async () => {
        const closeButton = this.getComponentElement(this.selectors.closeButton);
        await closeButton.click();

        // Wait for component to be hidden
        await this.waitForComponentElementHidden(this.selectors.form);
      },
      {
        component: "AnalyzeApartment",
        step: "closeForm",
      }
    );
  }

  /**
   * Close form with touch events
   */
  async closeFormWithTouch(): Promise<void> {
    await this.errorHandler.withErrorHandling(
      async () => {
        const closeButton = this.getComponentElement(this.selectors.closeButton);

        // Use touch events
        await closeButton.dispatchEvent("touchstart");
        await closeButton.dispatchEvent("touchend");
        await closeButton.click();

        // Wait for component to be hidden
        await this.waitForComponentElementHidden(this.selectors.form);
      },
      {
        component: "AnalyzeApartment",
        step: "closeFormWithTouch",
      }
    );
  }

  /**
   * Wait for analysis progress dialog to appear
   */
  async waitForProgressDialog(timeout = 10000): Promise<void> {
    await this.page.waitForSelector(this.selectors.progressDialog, { state: "visible", timeout });

    // Optionally wait for progress bar
    const progressBar = this.page.locator(this.selectors.progressBar);
    if ((await progressBar.count()) > 0) {
      await progressBar.waitFor({ state: "visible" });
    }
  }

  /**
   * Wait for analysis to complete (progress dialog disappears)
   */
  async waitForAnalysisCompletion(timeout = 30000): Promise<void> {
    await this.page.waitForSelector(this.selectors.progressDialog, { state: "hidden", timeout });
  }

  /**
   * Check if analysis completed successfully
   */
  async isAnalysisSuccessful(): Promise<boolean> {
    try {
      // Wait for progress dialog to disappear
      await this.waitForAnalysisCompletion(15000);

      // Check if there are no error messages
      const errorMessage = this.page.locator(this.selectors.errorMessage);
      const hasError = (await errorMessage.count()) > 0;

      return !hasError;
    } catch {
      return false;
    }
  }

  /**
   * Handle analysis error and retry
   */
  async handleAnalysisError(): Promise<void> {
    await this.errorHandler.withErrorHandling(
      async () => {
        // Wait for error message to appear
        await this.page.waitForSelector(this.selectors.errorMessage, {
          state: "visible",
          timeout: 5000,
        });

        // Click retry button if available
        const retryButton = this.page.locator(this.selectors.retryButton);
        if ((await retryButton.count()) > 0) {
          await retryButton.click();

          // Wait for progress dialog to appear again
          await this.waitForProgressDialog();
        }
      },
      {
        component: "AnalyzeApartment",
        step: "handleAnalysisError",
      }
    );
  }

  /**
   * Get current form values
   */
  async getFormValues(): Promise<WalkingDistanceData> {
    const parkValue = await this.getComponentElement(this.selectors.parkInput).inputValue();
    const supermarketValue = await this.getComponentElement(
      this.selectors.supermarketInput
    ).inputValue();
    const cafeValue = await this.getComponentElement(this.selectors.cafeInput).inputValue();

    return {
      park: Number.parseInt(parkValue) || 0,
      supermarket: Number.parseInt(supermarketValue) || 0,
      cafe: Number.parseInt(cafeValue) || 0,
    };
  }

  /**
   * Validate touch event support
   */
  async validateTouchEvents(): Promise<{ closeButton: boolean; analyzeButton: boolean }> {
    const closeButton = this.getComponentElement(this.selectors.closeButton);
    const analyzeButton = this.getComponentElement(this.selectors.analyzeButton);

    // Check if touch events are properly handled
    const closeTouchSupport =
      (await closeButton.getAttribute("ontouchend")) !== null ||
      (await closeButton.evaluate((el) => "ontouchend" in el));

    const analyzeTouchSupport =
      (await analyzeButton.getAttribute("onTouchEnd")) !== null ||
      (await analyzeButton.evaluate((el) => "ontouchend" in el));

    return {
      closeButton: closeTouchSupport,
      analyzeButton: analyzeTouchSupport,
    };
  }

  /**
   * Complete analysis workflow
   */
  async completeAnalysisWorkflow(data: WalkingDistanceData): Promise<{
    success: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      await this.fillWalkingDistances(data);
      await this.submitAnalysis();
      await this.waitForProgressDialog();

      const success = await this.isAnalysisSuccessful();
      const duration = Date.now() - startTime;

      return { success, duration };
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
