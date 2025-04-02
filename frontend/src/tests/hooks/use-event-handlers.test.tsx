import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import useEventHandlers from "@/components/city-map/hooks/use-event-handlers";
import { MapLayerMouseEvent } from "react-map-gl/maplibre";

// Define types for our mocked modules
interface MockFeaturePopupModule {
  __mocks: {
    mockSetLngLat: Mock;
    mockSetIsPopupOpen: Mock;
    mockSetProperties: Mock;
    mockHandlePopupClose: Mock;
  };
}

interface MockHooksModule {
  __mocks: {
    mockHandleAddressName: Mock;
  };
}

interface MockMapLibreModule {
  __mocks: {
    mockMap: {
      getStyle: Mock;
    };
    mockGetCanvas: Mock;
  };
}

interface MockAtomsModule {
  __mocks: {
    mockSetLastLayerId: Mock;
  };
}

// Define mock state for managing isSelectingPoint between tests
let isSelecting = false;

// Mock feature popup hook
vi.mock("@/components/city-map/hooks/use-feature-popup", () => {
  const mockSetLngLat = vi.fn();
  const mockSetIsPopupOpen = vi.fn();
  const mockSetProperties = vi.fn();
  const mockHandlePopupClose = vi.fn();

  return {
    __esModule: true,
    default: () => ({
      lngLat: { lng: -105, lat: 40 },
      properties: { id: "123", name: "Test" },
      isPopupOpen: false,
      isFavPopupOpen: false,
      setLngLat: mockSetLngLat,
      setIsPopupOpen: mockSetIsPopupOpen,
      setProperties: mockSetProperties,
      handlePopupClose: mockHandlePopupClose,
    }),
    __mocks: {
      mockSetLngLat,
      mockSetIsPopupOpen,
      mockSetProperties,
      mockHandlePopupClose,
    },
  };
});

// Mock check routes hook
vi.mock("@/hooks", () => {
  const mockHandleAddressName = vi.fn().mockResolvedValue(undefined);

  return {
    useCheckRoutes: () => ({
      route: null,
      animatedRoute: null,
      startingPoint: null,
      endingPoint: null,
      isBothSelected: false,
      isRouteLoading: false,
      isSelectingPoint: isSelecting,
      isStartingPointSelecting: false,
      isEndingPointSelecting: false,
      handleAddressName: mockHandleAddressName,
      handleAddStartingPoint: vi.fn(),
      handleAddEndingPoint: vi.fn(),
      handleToggleRouteSelect: vi.fn(),
      handleRemoveStartingPoint: vi.fn(),
      handleRemoveEndingPoint: vi.fn(),
      handleFitBoundsForRoute: vi.fn(),
    }),
    __mocks: {
      mockHandleAddressName,
    },
  };
});

// Mock map
vi.mock("react-map-gl/maplibre", () => {
  const mockGetCanvas = vi
    .fn()
    .mockReturnValue({ style: { cursor: "default" } });
  const mockMap = {
    getStyle: vi.fn().mockReturnValue({
      layers: [{ id: "layer1" }, { id: "layer2" }],
    }),
  };

  return {
    useMap: vi.fn().mockReturnValue({ map: mockMap }),
    __mocks: {
      mockMap,
      mockGetCanvas,
    },
  };
});

// Mock atoms
vi.mock("@/atoms", () => {
  const mockSetLastLayerId = vi.fn();

  return {
    useAtomLastLayerId: () => ({
      lastLayerId: "layer1",
      setLastLayerId: mockSetLastLayerId,
    }),
    __mocks: {
      mockSetLastLayerId,
    },
  };
});

describe("useEventHandlers hook", () => {
  // Store mock modules for use in tests
  let featurePopupMocks: MockFeaturePopupModule["__mocks"];
  let hooksMocks: MockHooksModule["__mocks"];
  let mapMocks: MockMapLibreModule["__mocks"];
  let atomsMocks: MockAtomsModule["__mocks"];

  beforeEach(async () => {
    vi.clearAllMocks();
    isSelecting = false;

    // Import and store mocks for easy access in tests
    featurePopupMocks = (
      (await import(
        "@/components/city-map/hooks/use-feature-popup"
      )) as unknown as MockFeaturePopupModule
    ).__mocks;
    hooksMocks = ((await import("@/hooks")) as unknown as MockHooksModule)
      .__mocks;
    mapMocks = (
      (await import("react-map-gl/maplibre")) as unknown as MockMapLibreModule
    ).__mocks;
    atomsMocks = ((await import("@/atoms")) as unknown as MockAtomsModule)
      .__mocks;
  });

  it("initializes with correct values", () => {
    // Arrange & Act
    const { result } = renderHook(() => useEventHandlers());

    // Assert
    expect(result.current.lngLat).toEqual({ lng: -105, lat: 40 });
    expect(result.current.properties).toEqual({ id: "123", name: "Test" });
    expect(result.current.isPopupOpen).toBe(false);
    expect(result.current.isFavPopupOpen).toBe(false);
    expect(typeof result.current.handleClick).toBe("function");
    expect(typeof result.current.handleMouseEnter).toBe("function");
    expect(typeof result.current.handleMouseLeave).toBe("function");
    expect(typeof result.current.handleIdle).toBe("function");
  });

  it("handles click event and opens popup when not selecting point", async () => {
    // Arrange
    const { result } = renderHook(() => useEventHandlers());
    const featureProperties = { id: "feature1" };
    const mockEvent = {
      features: [{ properties: featureProperties }],
      lngLat: { lng: -106, lat: 41 },
    } as unknown as MapLayerMouseEvent;

    // Act
    await act(async () => {
      await result.current.handleClick(mockEvent);
    });

    // Assert
    await waitFor(() => {
      expect(featurePopupMocks.mockSetLngLat).toHaveBeenCalledWith(
        mockEvent.lngLat,
      );
      expect(featurePopupMocks.mockSetIsPopupOpen).toHaveBeenCalledWith(true);
      expect(featurePopupMocks.mockSetProperties).toHaveBeenCalledWith(
        featureProperties,
      );
      expect(hooksMocks.mockHandleAddressName).not.toHaveBeenCalled();
    });
  });

  it("handles click event and calls handleAddressName when selecting point", async () => {
    // Arrange - set isSelecting to true for this test
    isSelecting = true;

    const { result } = renderHook(() => useEventHandlers());
    const mockEvent = {
      lngLat: { lng: -106, lat: 41 },
    } as unknown as MapLayerMouseEvent;

    // Act
    await act(async () => {
      await result.current.handleClick(mockEvent);
    });

    // Assert
    await waitFor(() => {
      expect(hooksMocks.mockHandleAddressName).toHaveBeenCalledWith(
        mockEvent.lngLat,
      );
      expect(featurePopupMocks.mockSetLngLat).not.toHaveBeenCalled();
      expect(featurePopupMocks.mockSetIsPopupOpen).not.toHaveBeenCalled();
      expect(featurePopupMocks.mockSetProperties).not.toHaveBeenCalled();
    });
  });

  it("handles mouse enter event and updates cursor style", async () => {
    // Arrange
    const { result } = renderHook(() => useEventHandlers());

    const mockEvent = {
      target: {
        getCanvas: mapMocks.mockGetCanvas,
      },
    } as unknown as MapLayerMouseEvent;

    // Act
    act(() => {
      result.current.handleMouseEnter(mockEvent);
    });

    // Assert
    await waitFor(() => {
      expect(mapMocks.mockGetCanvas).toHaveBeenCalled();
      expect(mockEvent.target.getCanvas().style.cursor).toBe("pointer");
    });
  });

  it("handles mouse leave event and updates cursor style", async () => {
    // Arrange
    const { result } = renderHook(() => useEventHandlers());

    const mockEvent = {
      target: {
        getCanvas: mapMocks.mockGetCanvas,
      },
    } as unknown as MapLayerMouseEvent;

    // Act
    act(() => {
      result.current.handleMouseLeave(mockEvent);
    });

    // Assert
    await waitFor(() => {
      expect(mapMocks.mockGetCanvas).toHaveBeenCalled();
      expect(mockEvent.target.getCanvas().style.cursor).toBe("default");
    });
  });

  it("handles idle event and updates last layer id", async () => {
    // Arrange
    const { result } = renderHook(() => useEventHandlers());

    // Act
    act(() => {
      result.current.handleIdle();
    });

    // Assert
    await waitFor(() => {
      expect(mapMocks.mockMap.getStyle).toHaveBeenCalled();
      expect(atomsMocks.mockSetLastLayerId).toHaveBeenCalledWith("layer2");
    });
  });
});
