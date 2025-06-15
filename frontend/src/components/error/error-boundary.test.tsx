import { useAtomCity } from "@/stores";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ErrorBoundary from "./error-boundary";

// Mock the store
const mockSetCity = vi.fn();
vi.mock("@/stores", () => ({
  useAtomCity: () => ({
    city: null,
    setCity: mockSetCity,
  }),
}));

// Mock ErrorFallback component to focus on ErrorBoundary behavior
vi.mock("./error-fallback", () => ({
  default: ({
    error,
    resetErrorBoundary,
  }: {
    error: Error;
    resetErrorBoundary: () => void;
  }) => (
    <div data-testid="error-fallback">
      <div data-testid="error-message">{error.message}</div>
      <button
        type="button"
        data-testid="reset-button"
        onClick={() => {
          resetErrorBoundary();
          mockSetCity(null);
        }}
      >
        Try again
      </button>
    </div>
  ),
}));

// Test component that can throw errors
const TestComponent = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test error occurred");
  }
  return <div data-testid="working-component">Component working normally</div>;
};

describe("ErrorBoundary", () => {
  beforeEach(() => {
    // Suppress console.error for cleaner test output
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("when no error occurs", () => {
    it("should render children normally", () => {
      // Arrange
      const testContent = <div data-testid="test-content">Normal content</div>;

      // Act
      render(<ErrorBoundary onReset={() => {}}>{testContent}</ErrorBoundary>);

      // Assert
      expect(screen.getByTestId("test-content")).toBeInTheDocument();
      expect(screen.queryByTestId("error-fallback")).not.toBeInTheDocument();
    });

    it("should not display error interface to user", () => {
      // Act
      render(
        <ErrorBoundary onReset={() => {}}>
          <TestComponent shouldThrow={false} />
        </ErrorBoundary>
      );

      // Assert
      expect(screen.getByTestId("working-component")).toBeInTheDocument();
      expect(screen.queryByTestId("error-fallback")).not.toBeInTheDocument();
    });
  });

  describe("when error occurs", () => {
    it("should display error fallback interface to user", () => {
      // Act
      render(
        <ErrorBoundary onReset={() => {}}>
          <TestComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      // Assert
      expect(screen.getByTestId("error-fallback")).toBeInTheDocument();
      expect(screen.getByTestId("error-message")).toHaveTextContent("Test error occurred");
      expect(screen.queryByTestId("working-component")).not.toBeInTheDocument();
    });

    it("should provide recovery mechanism for user", () => {
      // Act
      render(
        <ErrorBoundary onReset={() => {}}>
          <TestComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      // Assert
      expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
    });

    it("should display error message to user", () => {
      // Act
      render(
        <ErrorBoundary onReset={() => {}}>
          <TestComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      // Assert
      expect(screen.getByTestId("error-message")).toHaveTextContent("Test error occurred");
    });
  });

  describe("when user attempts recovery", () => {
    it("should call reset handler when user clicks retry", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnReset = vi.fn();

      // Act
      render(
        <ErrorBoundary onReset={mockOnReset}>
          <TestComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      await user.click(screen.getByRole("button", { name: /try again/i }));

      // Assert
      expect(mockOnReset).toHaveBeenCalledTimes(1);
    });

    it("should reset application state when user retries", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnReset = vi.fn();

      // Act
      render(
        <ErrorBoundary onReset={mockOnReset}>
          <TestComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      await user.click(screen.getByRole("button", { name: /try again/i }));

      // Assert
      expect(mockSetCity).toHaveBeenCalledWith(null);
      expect(mockOnReset).toHaveBeenCalled();
    });
  });

  describe("when handling different error types", () => {
    it("should handle runtime errors gracefully", () => {
      // Arrange
      const RuntimeErrorComponent = () => {
        throw new Error("Runtime error occurred");
      };

      // Act
      render(
        <ErrorBoundary onReset={() => {}}>
          <RuntimeErrorComponent />
        </ErrorBoundary>
      );

      // Assert
      expect(screen.getByTestId("error-fallback")).toBeInTheDocument();
      expect(screen.getByTestId("error-message")).toHaveTextContent("Runtime error occurred");
    });

    it("should handle async errors within components", () => {
      // Arrange
      const AsyncErrorComponent = () => {
        throw new Error("Async operation failed");
      };

      // Act
      render(
        <ErrorBoundary onReset={() => {}}>
          <AsyncErrorComponent />
        </ErrorBoundary>
      );

      // Assert
      expect(screen.getByTestId("error-fallback")).toBeInTheDocument();
      expect(screen.getByTestId("error-message")).toHaveTextContent("Async operation failed");
    });
  });
});
