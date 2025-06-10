import AnalysisProgressDialog from "@/features/map/components/AnalysisProgressDialog";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Setup mocks
const mockSetIsOpen = vi.fn();
let mockIsOpen = false;
let mockProgress = 0;

// Mock the useEffectHandlers hook
vi.mock("@/features/map/components/AnalysisProgressDialog/hooks/useEffectHandlers", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      isOpen: mockIsOpen,
      setIsOpen: mockSetIsOpen,
      progress: mockProgress,
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
    <div data-testid="mock-progress" data-value={value} className={className} />
  ),
}));

describe("AnalysisProgressDialog Component", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsOpen = false;
    mockProgress = 0;
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  it("displays progress information", () => {
    // Arrange
    mockIsOpen = true;
    mockProgress = 50;

    // Act
    render(
      <QueryClientProvider client={queryClient}>
        <AnalysisProgressDialog cityId={1} />
      </QueryClientProvider>
    );

    // Assert
    const progressText = screen.getByTestId("mock-dialog-description");
    expect(progressText).toHaveTextContent("Analyzing suitable apartments...");
    expect(screen.getByTestId("mock-progress")).toHaveAttribute("data-value", "50");
    expect(screen.getByText("Processing 50%")).toBeInTheDocument();
  });

  it("renders with the correct accessibility attributes", () => {
    // Arrange
    mockIsOpen = true;

    // Act
    render(
      <QueryClientProvider client={queryClient}>
        <AnalysisProgressDialog cityId={1} />
      </QueryClientProvider>
    );

    // Assert
    expect(screen.getByTestId("mock-dialog-title")).toHaveClass("sr-only");
    expect(screen.getByTestId("mock-dialog-title")).toHaveTextContent("Analysis Progress");
    expect(screen.getByTestId("mock-dialog-description")).toHaveClass("sr-only");
    expect(screen.getByTestId("mock-dialog-description")).toHaveTextContent(
      "Analyzing suitable apartments..."
    );
  });

  it("renders dialog when open", () => {
    // Arrange
    mockIsOpen = true;

    // Act
    render(
      <QueryClientProvider client={queryClient}>
        <AnalysisProgressDialog cityId={1} />
      </QueryClientProvider>
    );

    // Assert
    expect(screen.getByTestId("mock-dialog")).toHaveAttribute("data-open", "true");
  });

  it("does not render dialog when closed", () => {
    // Arrange
    mockIsOpen = false;

    // Act
    render(
      <QueryClientProvider client={queryClient}>
        <AnalysisProgressDialog cityId={1} />
      </QueryClientProvider>
    );

    // Assert
    expect(screen.getByTestId("mock-dialog")).toHaveAttribute("data-open", "false");
  });
});
