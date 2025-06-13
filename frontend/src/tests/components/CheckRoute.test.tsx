import CheckRoute from "@/features/map/components/CardContent/check-route";
import { useCheckRoutes } from "@/features/map/hooks";
import { fireEvent, render, screen } from "@testing-library/react";
import type { LngLat } from "react-map-gl/maplibre";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock implementations
const mockSetStartingPoint = vi.fn();
const mockSetEndingPoint = vi.fn();
const mockSetIsStartingPointSelecting = vi.fn();
const mockSetIsEndingPointSelecting = vi.fn();
const mockReversePoints = vi.fn();
const mockSetRoute = vi.fn();
const mockClearAllRouteStates = vi.fn();
const mockHandleAddressName = vi.fn();
const mockHandleGeocodeAddress = vi.fn();

// Create mock point objects
const mockStartingPoint = {
  lngLat: { lng: -105, lat: 40 } as LngLat,
  name: "Starting Location",
};

const mockEndingPoint = {
  lngLat: { lng: -106, lat: 41 } as LngLat,
  name: "Ending Location",
};

// Mock hooks
vi.mock("@/features/map/hooks", () => ({
  useCheckRoutes: vi.fn().mockImplementation(() => ({
    route: null,
    routeId: "no-route",
    startingPoint: null,
    endingPoint: null,
    isBothSelected: false,
    isSelectingPoint: false,
    isStartingPointSelecting: false,
    isEndingPointSelecting: false,
    isRouteFetching: false,
    setRoute: mockSetRoute,
    setStartingPoint: mockSetStartingPoint,
    setEndingPoint: mockSetEndingPoint,
    setIsStartingPointSelecting: mockSetIsStartingPointSelecting,
    setIsEndingPointSelecting: mockSetIsEndingPointSelecting,
    clearAllRouteStates: mockClearAllRouteStates,
    reversePoints: mockReversePoints,
    handleAddressName: mockHandleAddressName,
    handleGeocodeAddress: mockHandleGeocodeAddress,
  })),
}));

vi.mock("@/features/map/components/CardContent/check-route/select-point", () => ({
  default: ({
    isStarting,
    setPoint,
    isPointSelecting,
    setIsPointSelecting,
    onGeocodeAddress,
  }: {
    isStarting: boolean;
    setPoint: (point: { lngLat: LngLat; name: string }) => void;
    isPointSelecting: boolean;
    setIsPointSelecting: (selecting: boolean) => void;
    onGeocodeAddress: (address: string, isStarting: boolean) => Promise<void>;
  }) => (
    <div
      role="button"
      tabIndex={0}
      data-testid={`mock-select-point-${isStarting ? "starting" : "ending"}`}
      onClick={() => setIsPointSelecting(!isPointSelecting)}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          setIsPointSelecting(!isPointSelecting);
        }
      }}
    >
      <button
        type="button"
        data-testid={`mock-select-button-${isStarting ? "starting" : "ending"}`}
        onClick={(e) => {
          e.stopPropagation();
          if (isStarting) {
            setPoint({
              lngLat: { lng: -105, lat: 40 } as LngLat,
              name: "Selected Location",
            });
          } else {
            setPoint({
              lngLat: { lng: -106, lat: 41 } as LngLat,
              name: "Selected Location",
            });
          }
        }}
      >
        Select Point
      </button>
      <button
        type="button"
        data-testid={`mock-geocode-button-${isStarting ? "starting" : "ending"}`}
        onClick={async () => {
          await onGeocodeAddress("Test Address", isStarting);
        }}
      >
        Geocode Address
      </button>
    </div>
  ),
}));

vi.mock("@/features/map/components/CardContent/check-route/route-result", () => ({
  default: () => <div data-testid="mock-route-result">Route Result</div>,
}));

vi.mock("lucide-react", () => ({
  __esModule: true,
  ArrowDownUp: ({ onClick }: { onClick?: () => void }) => (
    // biome-ignore lint/a11y/useKeyWithClickEvents: test mock doesn't need keyboard events
    <div data-testid="mock-arrow-down-up" onClick={onClick}>
      ↕
    </div>
  ),
  Locate: ({ className }: { className?: string }) => (
    <div data-testid="mock-locate-icon" className={className} />
  ),
  LocateFixed: ({ className }: { className?: string }) => (
    <div data-testid="mock-locate-fixed-icon" className={className} />
  ),
  CircleX: ({
    className,
    onClick,
  }: {
    className?: string;
    onClick?: () => void;
  }) => (
    // biome-ignore lint/a11y/useKeyWithClickEvents: test mock doesn't need keyboard events
    <div data-testid="mock-circle-x" className={className} onClick={onClick}>
      ✕
    </div>
  ),
}));

describe("CheckRoute Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders select points and route result components", () => {
    // Act
    render(<CheckRoute />);

    // Assert
    expect(screen.getByTestId("mock-select-point-starting")).toBeInTheDocument();
    expect(screen.getByTestId("mock-select-point-ending")).toBeInTheDocument();
    expect(screen.getByTestId("mock-route-result")).toBeInTheDocument();
    expect(screen.queryByTestId("mock-arrow-down-up")).not.toBeInTheDocument();
  });

  it("shows reverse button when points are available", () => {
    // Arrange
    vi.mocked(useCheckRoutes).mockReturnValueOnce({
      route: null,
      routeId: "no-route",
      startingPoint: mockStartingPoint,
      endingPoint: mockEndingPoint,
      isBothSelected: true,
      isSelectingPoint: false,
      isStartingPointSelecting: false,
      isEndingPointSelecting: false,
      isRouteFetching: false,
      setRoute: mockSetRoute,
      setStartingPoint: mockSetStartingPoint,
      setEndingPoint: mockSetEndingPoint,
      setIsStartingPointSelecting: mockSetIsStartingPointSelecting,
      setIsEndingPointSelecting: mockSetIsEndingPointSelecting,
      clearAllRouteStates: mockClearAllRouteStates,
      reversePoints: mockReversePoints,
      handleReverseTouch: vi.fn(),
      handleAddressName: mockHandleAddressName,
      handleGeocodeAddress: mockHandleGeocodeAddress,
    });

    // Act
    render(<CheckRoute />);

    // Assert
    expect(screen.getByTestId("mock-arrow-down-up")).toBeInTheDocument();
  });

  it("calls reversePoints when swap button is clicked", () => {
    // Arrange
    vi.mocked(useCheckRoutes).mockReturnValueOnce({
      route: null,
      routeId: "no-route",
      startingPoint: mockStartingPoint,
      endingPoint: mockEndingPoint,
      isBothSelected: true,
      isSelectingPoint: false,
      isStartingPointSelecting: false,
      isEndingPointSelecting: false,
      isRouteFetching: false,
      setRoute: mockSetRoute,
      setStartingPoint: mockSetStartingPoint,
      setEndingPoint: mockSetEndingPoint,
      setIsStartingPointSelecting: mockSetIsStartingPointSelecting,
      setIsEndingPointSelecting: mockSetIsEndingPointSelecting,
      clearAllRouteStates: mockClearAllRouteStates,
      reversePoints: mockReversePoints,
      handleReverseTouch: vi.fn(),
      handleAddressName: mockHandleAddressName,
      handleGeocodeAddress: mockHandleGeocodeAddress,
    });

    // Act
    render(<CheckRoute />);
    fireEvent.click(screen.getByTestId("mock-arrow-down-up"));

    // Assert
    expect(mockReversePoints).toHaveBeenCalledTimes(1);
  });

  it("interacts with starting point selection correctly", () => {
    // Act
    render(<CheckRoute />);

    // Trigger point selection UI
    fireEvent.click(screen.getByTestId("mock-select-point-starting"));

    // Assert
    expect(mockSetIsStartingPointSelecting).toHaveBeenCalledWith(true);

    // Set a starting point
    fireEvent.click(screen.getByTestId("mock-select-button-starting"));

    // Assert
    expect(mockSetStartingPoint).toHaveBeenCalledWith({
      lngLat: { lng: -105, lat: 40 },
      name: "Selected Location",
    });
  });

  it("interacts with ending point selection correctly", () => {
    // Act
    render(<CheckRoute />);

    // Trigger point selection UI
    fireEvent.click(screen.getByTestId("mock-select-point-ending"));

    // Assert
    expect(mockSetIsEndingPointSelecting).toHaveBeenCalledWith(true);

    // Set an ending point
    fireEvent.click(screen.getByTestId("mock-select-button-ending"));

    // Assert
    expect(mockSetEndingPoint).toHaveBeenCalledWith({
      lngLat: { lng: -106, lat: 41 },
      name: "Selected Location",
    });
  });

  it("handles geocoding address input correctly", async () => {
    // Act
    render(<CheckRoute />);

    // Trigger geocoding for starting point
    fireEvent.click(screen.getByTestId("mock-geocode-button-starting"));

    // Assert
    expect(mockHandleGeocodeAddress).toHaveBeenCalledWith("Test Address", true);

    // Trigger geocoding for ending point
    fireEvent.click(screen.getByTestId("mock-geocode-button-ending"));

    // Assert
    expect(mockHandleGeocodeAddress).toHaveBeenCalledWith("Test Address", false);
  });
});
