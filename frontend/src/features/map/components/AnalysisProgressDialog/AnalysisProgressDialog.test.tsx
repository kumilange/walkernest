import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useEffectHandlers from "./hooks/useEffectHandlers";
import AnalysisProgressDialog from "./index";

// Mock the custom hook
vi.mock("./hooks/useEffectHandlers", () => ({
  default: vi.fn(),
}));

const mockUseEffectHandlers = vi.mocked(useEffectHandlers);

// Mock UI components to focus on behavior
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) => (
    <div data-testid="dialog" data-open={open}>
      {children}
    </div>
  ),
  DialogContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="dialog-content" className={className}>
      {children}
    </div>
  ),
  DialogTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h2 data-testid="dialog-title" className={className}>
      {children}
    </h2>
  ),
  DialogDescription: ({
    children,
    className,
  }: { children: React.ReactNode; className?: string }) => (
    <p data-testid="dialog-description" className={className}>
      {children}
    </p>
  ),
}));

vi.mock("@/components/ui/progress", () => ({
  Progress: ({ value, className }: { value: number; className?: string }) => (
    <div
      data-testid="progress"
      data-value={value}
      className={className}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
    />
  ),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

function renderWithQueryClient(ui: React.ReactElement, queryClient = createTestQueryClient()) {
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("AnalysisProgressDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when dialog is closed", () => {
    it("should not display dialog to user", () => {
      // Arrange
      mockUseEffectHandlers.mockReturnValue({
        isOpen: false,
        setIsOpen: vi.fn(),
        progress: 0,
        isError: false,
        error: null,
      });

      // Act
      renderWithQueryClient(<AnalysisProgressDialog cityId={1} />);

      // Assert
      expect(screen.getByTestId("dialog")).toHaveAttribute("data-open", "false");
    });
  });

  describe("when dialog is open", () => {
    it("should display analysis progress to user", () => {
      // Arrange
      mockUseEffectHandlers.mockReturnValue({
        isOpen: true,
        setIsOpen: vi.fn(),
        progress: 50,
        isError: false,
        error: null,
      });

      // Act
      renderWithQueryClient(<AnalysisProgressDialog cityId={1} />);

      // Assert
      expect(screen.getByTestId("dialog")).toHaveAttribute("data-open", "true");
      expect(screen.getByTestId("dialog-description")).toHaveTextContent(
        "Analyzing suitable apartments..."
      );
      expect(screen.getByText("Processing 50%")).toBeInTheDocument();
    });

    it("should display progress bar with correct value", () => {
      // Arrange
      mockUseEffectHandlers.mockReturnValue({
        isOpen: true,
        setIsOpen: vi.fn(),
        progress: 75,
        isError: false,
        error: null,
      });

      // Act
      renderWithQueryClient(<AnalysisProgressDialog cityId={1} />);

      // Assert
      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toHaveAttribute("data-value", "75");
    });

    it("should provide accessible dialog structure", () => {
      // Arrange
      mockUseEffectHandlers.mockReturnValue({
        isOpen: true,
        setIsOpen: vi.fn(),
        progress: 25,
        isError: false,
        error: null,
      });

      // Act
      renderWithQueryClient(<AnalysisProgressDialog cityId={1} />);

      // Assert
      const dialogTitle = screen.getByTestId("dialog-title");
      const dialogDescription = screen.getByTestId("dialog-description");

      expect(dialogTitle).toHaveTextContent("Analysis Progress");
      expect(dialogTitle).toHaveClass("sr-only");
      expect(dialogDescription).toHaveTextContent("Analyzing suitable apartments...");
      expect(dialogDescription).toHaveClass("sr-only");
    });
  });

  describe("when progress changes", () => {
    it("should update progress percentage display", () => {
      // Arrange
      mockUseEffectHandlers.mockReturnValue({
        isOpen: true,
        setIsOpen: vi.fn(),
        progress: 90,
        isError: false,
        error: null,
      });

      // Act
      renderWithQueryClient(<AnalysisProgressDialog cityId={1} />);

      // Assert
      expect(screen.getByText("Processing 90%")).toBeInTheDocument();
    });

    it("should handle zero progress", () => {
      // Arrange
      mockUseEffectHandlers.mockReturnValue({
        isOpen: true,
        setIsOpen: vi.fn(),
        progress: 0,
        isError: false,
        error: null,
      });

      // Act
      renderWithQueryClient(<AnalysisProgressDialog cityId={1} />);

      // Assert
      expect(screen.getByText("Processing 0%")).toBeInTheDocument();
      expect(screen.getByRole("progressbar")).toHaveAttribute("data-value", "0");
    });

    it("should handle complete progress", () => {
      // Arrange
      mockUseEffectHandlers.mockReturnValue({
        isOpen: true,
        setIsOpen: vi.fn(),
        progress: 100,
        isError: false,
        error: null,
      });

      // Act
      renderWithQueryClient(<AnalysisProgressDialog cityId={1} />);

      // Assert
      expect(screen.getByText("Processing 100%")).toBeInTheDocument();
      expect(screen.getByRole("progressbar")).toHaveAttribute("data-value", "100");
    });
  });
});
