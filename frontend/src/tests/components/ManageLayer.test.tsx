import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ManageLayer from "@/components/card-content/manage-layer";

// Mock implementation
const mockSetLayersVisibility = vi.fn();

vi.mock("@/atoms", () => ({
  useAtomLayersVisibility: () => ({
    layersVisibility: {
      result: true,
      cluster: true,
      park: true,
      supermarket: false,
      cafe: true,
      boundary: false,
    },
    setLayersVisibility: mockSetLayersVisibility,
  }),
}));

vi.mock("@/components/ui/label", () => ({
  Label: ({ htmlFor, children, className }: any) => (
    <label
      data-testid={`mock-label-${htmlFor}`}
      htmlFor={htmlFor}
      className={className}
    >
      {children}
    </label>
  ),
}));

vi.mock("@/components/ui/switch", () => ({
  Switch: ({ id, defaultChecked, onCheckedChange }: any) => (
    <input
      type="checkbox"
      data-testid={`mock-switch-${id}`}
      id={id}
      defaultChecked={defaultChecked}
      onChange={(e) => onCheckedChange(e.target.checked)}
    />
  ),
}));

vi.mock("lucide-react", () => ({
  Trees: () => <div data-testid="mock-icon-trees">Trees Icon</div>,
  House: () => <div data-testid="mock-icon-house">House Icon</div>,
  ShoppingCart: () => (
    <div data-testid="mock-icon-shopping-cart">Shopping Cart Icon</div>
  ),
  Coffee: () => <div data-testid="mock-icon-coffee">Coffee Icon</div>,
  BoxSelect: () => (
    <div data-testid="mock-icon-box-select">Box Select Icon</div>
  ),
  ChartNetwork: () => (
    <div data-testid="mock-icon-chart-network">Chart Network Icon</div>
  ),
}));

describe("ManageLayer Component", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders all layer options with icons", () => {
    // Act
    render(<ManageLayer />);

    // Assert
    expect(screen.getByTestId("mock-label-result")).toBeInTheDocument();
    expect(screen.getByTestId("mock-label-cluster")).toBeInTheDocument();
    expect(screen.getByTestId("mock-label-park")).toBeInTheDocument();
    expect(screen.getByTestId("mock-label-supermarket")).toBeInTheDocument();
    expect(screen.getByTestId("mock-label-cafe")).toBeInTheDocument();
    expect(screen.getByTestId("mock-label-boundary")).toBeInTheDocument();

    expect(screen.getByTestId("mock-icon-house")).toBeInTheDocument();
    expect(screen.getByTestId("mock-icon-chart-network")).toBeInTheDocument();
    expect(screen.getByTestId("mock-icon-trees")).toBeInTheDocument();
    expect(screen.getByTestId("mock-icon-shopping-cart")).toBeInTheDocument();
    expect(screen.getByTestId("mock-icon-coffee")).toBeInTheDocument();
    expect(screen.getByTestId("mock-icon-box-select")).toBeInTheDocument();
  });

  it("initializes switches with correct values", () => {
    // Act
    render(<ManageLayer />);

    // Assert
    expect(screen.getByTestId("mock-switch-result")).toHaveProperty(
      "defaultChecked",
      true,
    );
    expect(screen.getByTestId("mock-switch-cluster")).toHaveProperty(
      "defaultChecked",
      true,
    );
    expect(screen.getByTestId("mock-switch-park")).toHaveProperty(
      "defaultChecked",
      true,
    );
    expect(screen.getByTestId("mock-switch-supermarket")).toHaveProperty(
      "defaultChecked",
      false,
    );
    expect(screen.getByTestId("mock-switch-cafe")).toHaveProperty(
      "defaultChecked",
      true,
    );
    expect(screen.getByTestId("mock-switch-boundary")).toHaveProperty(
      "defaultChecked",
      false,
    );
  });

  it("calls setLayersVisibility when switches are toggled", () => {
    // Act
    render(<ManageLayer />);

    // Toggle park layer off
    fireEvent.click(screen.getByTestId("mock-switch-park"));

    // Assert
    expect(mockSetLayersVisibility).toHaveBeenCalledWith(expect.any(Function));

    // Extract and call the updater function
    const updaterFn = mockSetLayersVisibility.mock.calls[0][0];
    const result = updaterFn({
      result: true,
      cluster: true,
      park: true,
      supermarket: false,
      cafe: true,
      boundary: false,
    });

    // Verify that only the park value was toggled
    expect(result).toEqual({
      result: true,
      cluster: true,
      park: false,
      supermarket: false,
      cafe: true,
      boundary: false,
    });
  });

  it("displays correct layer labels", () => {
    // Act
    render(<ManageLayer />);

    // Assert
    expect(screen.getByText("Matched Apartment")).toBeInTheDocument();
    expect(screen.getByText("Cluster")).toBeInTheDocument();
    expect(screen.getByText("Park & Dog Park")).toBeInTheDocument();
    expect(screen.getByText("Supermarket")).toBeInTheDocument();
    expect(screen.getByText("Cafe")).toBeInTheDocument();
    expect(screen.getByText("City Boundary")).toBeInTheDocument();
  });
});
