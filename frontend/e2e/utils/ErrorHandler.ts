import type { Page } from "@playwright/test";
import type { RetryConfig, TestError } from "../types/TestTypes";

/**
 * Error handling utilities for E2E tests
 * Provides consistent error handling, retry logic, and debugging support
 */
export class ErrorHandler {
  private readonly page: Page;
  private readonly screenshotPath: string;

  constructor(page: Page, screenshotPath = "e2e/test-results/screenshots") {
    this.page = page;
    this.screenshotPath = screenshotPath;
  }

  /**
   * Handle test errors with context and debugging information
   */
  async handleError(
    error: Error,
    context: {
      component?: string;
      selector?: string;
      step?: string;
    }
  ): Promise<TestError> {
    const timestamp = Date.now();
    const screenshotFile = `error-${timestamp}.png`;

    // Take screenshot for debugging
    try {
      await this.page.screenshot({
        path: `${this.screenshotPath}/${screenshotFile}`,
        fullPage: true,
      });
    } catch (screenshotError) {
      console.warn("Failed to take error screenshot:", screenshotError);
    }

    // Determine error type
    const errorType = this.determineErrorType(error);

    const testError: TestError = {
      type: errorType,
      message: error.message,
      component: context.component,
      selector: context.selector,
      screenshot: screenshotFile,
      stackTrace: error.stack,
    };

    // Log error details
    console.error(`[ErrorHandler] ${errorType} error:`, {
      message: error.message,
      context,
      screenshot: screenshotFile,
    });

    return testError;
  }

  /**
   * Retry operation with configurable retry logic
   */
  async retry<T>(operation: () => Promise<T>, config: RetryConfig, context: string): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Check if we should retry this error
        if (!config.retryCondition(lastError)) {
          throw lastError;
        }

        // If this is the last attempt, don't delay
        if (attempt === config.maxRetries) {
          break;
        }

        console.log(
          `[ErrorHandler] Retry attempt ${attempt + 1}/${config.maxRetries} for ${context}: ${lastError.message}`
        );
        await this.page.waitForTimeout(config.retryDelay);
      }
    }

    throw lastError || new Error(`All ${config.maxRetries} retry attempts failed for ${context}`);
  }

  /**
   * Create default retry configuration
   */
  createRetryConfig(overrides?: Partial<RetryConfig>): RetryConfig {
    return {
      maxRetries: 1,
      retryDelay: 1000,
      retryCondition: (error: Error) => this.isRetryableError(error),
      ...overrides,
    };
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const retryablePatterns = [
      /timeout/i,
      /network/i,
      /connection/i,
      /loading/i,
      /temporarily unavailable/i,
    ];

    return retryablePatterns.some((pattern) => pattern.test(error.message));
  }

  /**
   * Determine error type based on error message and context
   */
  private determineErrorType(error: Error): TestError["type"] {
    const message = error.message.toLowerCase();

    if (message.includes("timeout") || message.includes("waiting")) {
      return "timeout";
    }

    if (message.includes("expected") || message.includes("assertion")) {
      return "assertion";
    }

    if (message.includes("api") || message.includes("network") || message.includes("request")) {
      return "api";
    }

    if (message.includes("component") || message.includes("element")) {
      return "component";
    }

    return "flow";
  }

  /**
   * Create error context for better debugging
   */
  async createErrorContext(): Promise<{
    url: string;
    title: string;
    localStorage: Record<string, string>;
    sessionStorage: Record<string, string>;
    console: string[];
  }> {
    const context = {
      url: this.page.url(),
      title: await this.page.title(),
      localStorage: {},
      sessionStorage: {},
      console: [],
    };

    try {
      // Get localStorage data
      context.localStorage = await this.page.evaluate(() => {
        const items: Record<string, string> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            items[key] = localStorage.getItem(key) || "";
          }
        }
        return items;
      });

      // Get sessionStorage data
      context.sessionStorage = await this.page.evaluate(() => {
        const items: Record<string, string> = {};
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key) {
            items[key] = sessionStorage.getItem(key) || "";
          }
        }
        return items;
      });
    } catch (storageError) {
      console.warn("Failed to get storage context:", storageError);
    }

    return context;
  }

  /**
   * Wrapper for operations that need error handling
   */
  async withErrorHandling<T>(
    operation: () => Promise<T>,
    context: {
      component?: string;
      selector?: string;
      step?: string;
    },
    retryConfig?: Partial<RetryConfig>
  ): Promise<T> {
    try {
      if (retryConfig) {
        return await this.retry(
          operation,
          this.createRetryConfig(retryConfig),
          context.step || "operation"
        );
      }
      return await operation();
    } catch (error) {
      const testError = await this.handleError(error as Error, context);
      const enhancedError = new Error(`${testError.type} error: ${testError.message}`);
      // Add cause property safely for older TypeScript versions
      (enhancedError as Error & { cause?: unknown }).cause = error;
      throw enhancedError;
    }
  }
}
