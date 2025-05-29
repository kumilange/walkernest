import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AnalysisProgressDialog from "@/features/map/components/AnalysisProgressDialog"
import userEvent from "@testing-library/user-event";

// Setup mocks
const mockSetIsOpen = vi.fn();
let mockIsOpen = false;
let mockProgress = 0;
let mockIsError = false;
let mockError: Error | null = null;

// Mock the useEffectHandlers hook
vi.mock("@/features/map/components/AnalysisProgressDialog/hooks/useEffectHandlers", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      isOpen: mockIsOpen,
      setIsOpen: mockSetIsOpen,
      progress: mockProgress,
      isError: mockIsError,
      error: mockError,
    })),
  };
});

// Mock the Dialog components
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({
    children,
    open,
  }: {
    children: React.ReactNode;
    open: boolean;
  }) => (
    <div data-testid="mock-dialog" data-open={open}>
      {children}
    </div>
  ),
  DialogContent: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="mock-dialog-content" className={className}>
      {children}
    </div>
  ),
  DialogTitle: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <h2 data-testid="mock-dialog-title" className={className}>
      {children}
    </h2>
  ),
  DialogDescription: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <p data-testid="mock-dialog-description" className={className}>
      {children}
    </p>
  ),
}));

// Mock the Progress component
vi.mock("@/components/ui/progress", () => ({
  Progress: ({ value, className }: { value: number; className?: string }) => (
    <div
      data-testid="mock-progress"
      data-value={value}
      className={className}
    ></div>
  ),
}));

// Mock the ErrorDialogContent component
vi.mock("@/features/map/components/AnalysisProgressDialog/ErrorDialogContent", () => ({
  default: ({
    setOpen,
    error,
  }: {
    setOpen: (open: boolean) => void;
    error: Error | null;
  }) => (
    <div data-testid="mock-error-dialog-content">
      <p data-testid="mock-error-message">
        Error: {error?.message || "Unknown error"}
      </p>
      <button data-testid="mock-close-button" onClick={() => setOpen(false)}>
        Close
      </button>
    </div>
  ),
}));

// Mock the utility functions
vi.mock("@/lib/misc", () => ({
  getErrorMessage: (error: Error | null) => error?.message || "Unknown error",
}));

describe("AnalysisProgressDialog Component", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsOpen = false;
    mockProgress = 0;
    mockIsError = false;
    mockError = null;
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  it("displays progress information when not in error state", () => {
    // Arrange
    mockIsOpen = true;
    mockProgress = 50;

    // Act
    render(
      <QueryClientProvider client={queryClient}>
        <AnalysisProgressDialog cityId={1} />
      </QueryClientProvider>,
    );

    // Assert
    // Use a more specific selector to avoid ambiguity
    const progressText = screen.getByTestId("mock-dialog-description");
    expect(progressText).toHaveTextContent("Analyzing suitable apartments...");
    expect(screen.getByTestId("mock-progress")).toHaveAttribute(
      "data-value",
      "50",
    );
    expect(screen.getByText("Processing 50%")).toBeInTheDocument();
  });

  it("displays error content when in error state", () => {
    // Arrange
    mockIsOpen = true;
    mockIsError = true;
    mockError = new Error("Test error message");

    // Act
    render(
      <QueryClientProvider client={queryClient}>
        <AnalysisProgressDialog cityId={1} />
      </QueryClientProvider>,
    );

    // Assert
    expect(screen.getByTestId("mock-error-dialog-content")).toBeInTheDocument();
    expect(screen.getByTestId("mock-error-message")).toHaveTextContent(
      "Error: Test error message",
    );
  });

  it("calls setIsOpen when close button is clicked in error state", async () => {
    // Arrange
    mockIsOpen = true;
    mockIsError = true;
    mockError = new Error("Test error message");
    const user = userEvent.setup();

    // Act
    render(
      <QueryClientProvider client={queryClient}>
        <AnalysisProgressDialog cityId={1} />
      </QueryClientProvider>,
    );
    await user.click(screen.getByTestId("mock-close-button"));

    // Assert
    expect(mockSetIsOpen).toHaveBeenCalledWith(false);
  });

  it("renders with the correct accessibility attributes", () => {
    // Arrange
    mockIsOpen = true;

    // Act
    render(
      <QueryClientProvider client={queryClient}>
        <AnalysisProgressDialog cityId={1} />
      </QueryClientProvider>,
    );

    // Assert
    expect(screen.getByTestId("mock-dialog-title")).toHaveClass("sr-only");
    expect(screen.getByTestId("mock-dialog-title")).toHaveTextContent(
      "Analysis Progress",
    );
    expect(screen.getByTestId("mock-dialog-description")).toHaveClass(
      "sr-only",
    );
    expect(screen.getByTestId("mock-dialog-description")).toHaveTextContent(
      "Analyzing suitable apartments...",
    );
  });

  it("changes the dialog description when in error state", () => {
    // Arrange
    mockIsOpen = true;
    mockIsError = true;
    mockError = new Error("Test error message");

    // Act
    render(
      <QueryClientProvider client={queryClient}>
        <AnalysisProgressDialog cityId={1} />
      </QueryClientProvider>,
    );

    // Assert
    expect(screen.getByTestId("mock-dialog-description")).toHaveTextContent(
      "Test error message",
    );
  });
});
