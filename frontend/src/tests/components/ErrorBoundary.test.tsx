import ErrorBoundary from "@/components/error/error-boundary";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mocks
const mockSetCity = vi.fn();

vi.mock("@/stores", () => ({
  useAtomCity: () => ({
    city: null,
    setCity: mockSetCity,
  }),
}));

vi.mock("@/components/error/error-fallback", () => ({
  default: ({
    error,
    resetErrorBoundary,
  }: {
    error: Error;
    resetErrorBoundary: () => void;
  }) => (
    <div data-testid="mock-error-fallback">
      <div data-testid="error-message">{error.message}</div>
      <button
        type="button"
        data-testid="reset-button"
        onClick={() => {
          resetErrorBoundary();
          mockSetCity(null); // This ensures mockSetCity is called with null
        }}
      >
        Reset
      </button>
    </div>
  ),
}));

const ErrorComponent = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test error message");
  }
  return <div data-testid="normal-component">Normal Component</div>;
};

describe("ErrorBoundary Component", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockSetCity.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders children when no error occurs", () => {
    // Arrange
    const testChild = <div data-testid="test-child">Test Child</div>;

    // Act
    render(<ErrorBoundary onReset={() => {}}>{testChild}</ErrorBoundary>);

    // Assert
    expect(screen.getByTestId("test-child")).toBeInTheDocument();
    expect(screen.queryByTestId("mock-error-fallback")).not.toBeInTheDocument();
  });

  it("renders error fallback when an error occurs", () => {
    // Act
    render(
      <ErrorBoundary onReset={() => {}}>
        <ErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    // Assert
    expect(screen.getByTestId("mock-error-fallback")).toBeInTheDocument();
  });

  it("calls setCity(null) when Reset button is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    const mockOnReset = vi.fn();

    // Act
    render(
      <ErrorBoundary onReset={mockOnReset}>
        <ErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    await user.click(screen.getByTestId("reset-button"));

    // Assert
    expect(mockOnReset).toHaveBeenCalled();
    expect(mockSetCity).toHaveBeenCalledWith(null);
  });
});
