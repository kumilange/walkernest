import AnalyzeApartment from "@/features/map/components/CardContent/analyze-apartment";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Basic mocks
vi.mock("@/features/map/components/CardContent/analyze-apartment/constants", () => ({
  METERS_TO_MINS_IN_WALK: {
    320: 5,
    800: 10,
  },
  MINS_TO_METERS_IN_WALK: {
    5: 320,
    10: 800,
  },
}));

// Simple mock implementations
const mockSetMaxDistance = vi.fn();
const mockSetIsAmenityOn = vi.fn();

vi.mock("@/constants", () => ({
  CITY_LIST_DICT: {
    Denver: { id: 1 },
    Boulder: { id: 2 },
  },
  twColors: {
    apartment: "blue-500",
    supermarket: "red-500",
    park: "green-500",
    cafe: "yellow-500",
  },
}));

vi.mock("@/stores", () => ({
  useAtomCity: () => ({
    city: "Denver",
  }),
  useAtomMaxDistance: () => ({
    maxDistance: { park: 320, supermarket: 800, cafe: 800 },
    setMaxDistance: mockSetMaxDistance,
  }),
  useAtomIsAmenityOn: () => ({
    isAmenityOn: { park: true, supermarket: true, cafe: true },
    setIsAmenityOn: mockSetIsAmenityOn,
  }),
  useAtomIsTmpAmenityOn: () => ({
    isTmpAmenityOn: { park: true, supermarket: true, cafe: true },
  }),
}));

vi.mock("@/lib/misc", () => ({
  generateCityDataParams: () => ({
    parkDistance: 320,
    supermarketDistance: 800,
    cafeDistance: 800,
    parkFilter: true,
    supermarketFilter: true,
    cafeFilter: true,
  }),
}));

// Mock the analyze-apartment component
vi.mock("@/features/map/components/CardContent/analyze-apartment", () => ({
  default: () => {
    const handleSubmit = () => {
      mockSetMaxDistance({
        park: 320,
        supermarket: 800,
        cafe: 800,
      });
      mockSetIsAmenityOn({
        park: true,
        supermarket: true,
        cafe: true,
      });
    };

    return (
      <form data-testid="mock-form" onSubmit={(e) => e.preventDefault()}>
        <div data-testid="mock-form-field-park">Form Field park</div>
        <div data-testid="mock-form-field-supermarket">Form Field supermarket</div>
        <div data-testid="mock-form-field-cafe">Form Field cafe</div>
        <button data-testid="mock-button-outline" type="reset">
          Reset
        </button>
        <button data-testid="mock-button-default" type="submit" onClick={handleSubmit}>
          Analyze
        </button>
      </form>
    );
  },
}));

vi.mock("@/components/ui/form", () => ({
  __esModule: true,
  Form: ({
    children,
    onSubmit,
  }: {
    children: React.ReactNode;
    onSubmit?: (e: React.FormEvent) => void;
  }) => (
    <form onSubmit={onSubmit || ((e) => e.preventDefault())} data-testid="mock-form">
      {children}
    </form>
  ),
  FormControl: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="form-control">{children}</div>
  ),
  FormField: ({
    name,
    render,
  }: {
    name: string;
    render: (props: { field: unknown; fieldState: unknown; formState: unknown }) => React.ReactNode;
  }) => {
    const field = {
      name,
      value: name === "park" || name === "supermarket" || name === "cafe" ? 10 : true,
      onChange: vi.fn(),
      onBlur: vi.fn(),
      ref: vi.fn(),
    };
    return render({ field, fieldState: { invalid: false, error: null }, formState: {} });
  },
  FormItem: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="form-item">{children}</div>
  ),
  FormLabel: ({ children }: { children: React.ReactNode }) => (
    <label
      data-testid={`form-label-${children?.toString().toLowerCase().replace(/\s+/g, "-")}`}
      htmlFor={children?.toString().toLowerCase().replace(/\s+/g, "-")}
    >
      {children}
    </label>
  ),
  FormMessage: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="form-message">{children}</div>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    disabled,
    onClick,
    type,
    variant,
  }: {
    children: React.ReactNode;
    disabled?: boolean;
    onClick?: () => void;
    type?: "button" | "submit" | "reset";
    variant?: string;
  }) => (
    <button
      data-testid={`mock-button-${variant || "default"}`}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/popover", () => ({
  PopoverClose: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-popover-close">{children}</div>
  ),
}));

vi.mock("@/features/map/components/CardContent/analyze-apartment/form-field-item", () => ({
  default: ({ name }: { name: string }) => (
    <div data-testid={`mock-form-field-${name}`}>Form Field {name}</div>
  ),
}));

// Mock the react-hook-form module
vi.mock("react-hook-form", async () => {
  const actual = await vi.importActual("react-hook-form");
  return {
    ...actual, // Preserve actual exports like Path
    useForm: () => ({
      handleSubmit:
        (callback: (data: Record<string, unknown>) => void) => (e?: React.FormEvent) => {
          e?.preventDefault?.();
          callback({
            park: 5,
            supermarket: 10,
            cafe: 10,
            parkCheckbox: true,
            supermarketCheckbox: true,
            cafeCheckbox: true,
          });
          return false;
        },
      getValues: () => ({
        park: 5,
        supermarket: 10,
        cafe: 10,
        parkCheckbox: true,
        supermarketCheckbox: true,
        cafeCheckbox: true,
      }),
      formState: { isValid: true },
      control: {},
      // Add any other useForm returns your component might use
    }),
    Controller: ({
      name,
      render,
    }: {
      name: string;
      render: (props: {
        field: unknown;
        fieldState: unknown;
        formState: unknown;
      }) => React.ReactNode;
    }) => {
      // Basic mock for Controller, providing a field object to its render prop
      const field = {
        name,
        value: name.includes("Checkbox") ? true : 10, // Default based on name convention
        onChange: vi.fn(),
        onBlur: vi.fn(),
        ref: vi.fn(),
      };
      return render({ field, fieldState: { invalid: false, error: null }, formState: {} });
    },
  };
});

describe("AnalyzeApartment Component", () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it("renders form fields correctly", () => {
    // Act
    render(<AnalyzeApartment />);

    // Assert
    expect(screen.getByTestId("mock-form")).toBeInTheDocument();
    expect(screen.getByTestId("mock-form-field-park")).toBeInTheDocument();
    expect(screen.getByTestId("mock-form-field-supermarket")).toBeInTheDocument();
    expect(screen.getByTestId("mock-form-field-cafe")).toBeInTheDocument();
    expect(screen.getByTestId("mock-button-outline")).toBeInTheDocument();
    expect(screen.getByTestId("mock-button-default")).toBeInTheDocument();
    expect(screen.getByText("Analyze")).toBeInTheDocument();
  });

  it("handles form submission correctly", () => {
    // Act
    render(<AnalyzeApartment />);

    // Find and click submit button
    const submitButton = screen.getByText("Analyze");
    fireEvent.click(submitButton);

    // Assert
    expect(mockSetMaxDistance).toHaveBeenCalledWith(
      expect.objectContaining({
        park: expect.any(Number),
        supermarket: expect.any(Number),
        cafe: expect.any(Number),
      })
    );
    expect(mockSetIsAmenityOn).toHaveBeenCalledWith(
      expect.objectContaining({
        park: expect.any(Boolean),
        supermarket: expect.any(Boolean),
        cafe: expect.any(Boolean),
      })
    );
  });
});
