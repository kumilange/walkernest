import { act, renderHook, waitFor } from "@testing-library/react";
import type { MapLayerMouseEvent } from "react-map-gl/maplibre";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useCityMapEventHandlers from "./useEventHandlers";

// Mock dependencies
const mockSetLngLat = vi.fn();
const mockSetIsPopupOpen = vi.fn();
const mockSetProperties = vi.fn();
const mockHandlePopupClose = vi.fn();
const mockHandleAddressName = vi.fn().mockResolvedValue(undefined);
const mockSetLastLayerId = vi.fn();

// Mock map instance
const mockMapGetStyle = vi.fn().mockReturnValue({
  layers: [{ id: "layer1" }, { id: "layer2" }],
});
const mockGetCanvas = vi.fn().mockReturnValue({
  style: { cursor: "default" },
});

const mockMapInstance = {
  getStyle: mockMapGetStyle,
  getCanvas: mockGetCanvas,
};

// Track selection state
let isSelecting = false;

vi.mock("@/features/map/components/FeaturePopup/hooks", () => ({
  useFeaturePopup: () => ({
    lngLat: { lng: -105, lat: 40 },
    properties: { id: "123", name: "Test" },
    isPopupOpen: false,
    isFavPopupOpen: false,
    setLngLat: mockSetLngLat,
    setIsPopupOpen: mockSetIsPopupOpen,
    setProperties: mockSetProperties,
    handlePopupClose: mockHandlePopupClose,
  }),
}));

vi.mock("@/features/map/hooks/useCheckRoutes", () => ({
  __esModule: true,
  default: () => ({
    isSelectingPoint: isSelecting,
    handleAddressName: mockHandleAddressName,
  }),
}));

vi.mock("@/features/map/stores/layerAtoms", () => ({
  useAtomLastLayerId: () => ({
    setLastLayerId: mockSetLastLayerId,
  }),
}));

vi.mock("react-map-gl/maplibre", async () => {
  const actual = await vi.importActual("react-map-gl/maplibre");
  return {
    ...actual,
    useMap: () => ({ map: mockMapInstance }),
  };
});

describe("useCityMapEventHandlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isSelecting = false;
    mockMapGetStyle.mockReturnValue({
      layers: [{ id: "layer1" }, { id: "layer2" }],
    });
    mockGetCanvas.mockReturnValue({ style: { cursor: "default" } });
  });

  describe("initialization", () => {
    it("should initialize with correct default values", () => {
      // Arrange & Act
      const { result } = renderHook(() => useCityMapEventHandlers());

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
  });

  describe("click handling", () => {
    it("should open popup when not selecting point", async () => {
      // Arrange
      const { result } = renderHook(() => useCityMapEventHandlers());
      const featureProperties = { id: "feature1", name: "Test Feature" };
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
        expect(mockSetLngLat).toHaveBeenCalledWith(mockEvent.lngLat);
        expect(mockSetIsPopupOpen).toHaveBeenCalledWith(true);
        expect(mockSetProperties).toHaveBeenCalledWith(featureProperties);
        expect(mockHandleAddressName).not.toHaveBeenCalled();
      });
    });

    it("should handle address name when selecting point", async () => {
      // Arrange
      isSelecting = true;
      const { result } = renderHook(() => useCityMapEventHandlers());
      const mockEvent = {
        lngLat: { lng: -106, lat: 41 },
      } as unknown as MapLayerMouseEvent;

      // Act
      await act(async () => {
        await result.current.handleClick(mockEvent);
      });

      // Assert
      await waitFor(() => {
        expect(mockHandleAddressName).toHaveBeenCalledWith(mockEvent.lngLat);
        expect(mockSetLngLat).not.toHaveBeenCalled();
        expect(mockSetIsPopupOpen).not.toHaveBeenCalled();
      });
    });
  });

  describe("mouse interactions", () => {
    it("should set cursor to pointer on mouse enter", () => {
      // Arrange
      const { result } = renderHook(() => useCityMapEventHandlers());
      const mockCanvas = { style: { cursor: "default" } };
      const mockEvent = {
        target: { getCanvas: () => mockCanvas },
      } as unknown as MapLayerMouseEvent;

      // Act
      result.current.handleMouseEnter(mockEvent);

      // Assert
      expect(mockCanvas.style.cursor).toBe("pointer");
    });

    it("should set cursor to default on mouse leave", () => {
      // Arrange
      const { result } = renderHook(() => useCityMapEventHandlers());
      const mockCanvas = { style: { cursor: "pointer" } };
      const mockEvent = {
        target: { getCanvas: () => mockCanvas },
      } as unknown as MapLayerMouseEvent;

      // Act
      result.current.handleMouseLeave(mockEvent);

      // Assert
      expect(mockCanvas.style.cursor).toBe("default");
    });
  });

  describe("idle handling", () => {
    it("should set last layer ID when map becomes idle", () => {
      // Arrange
      const { result } = renderHook(() => useCityMapEventHandlers());

      // Act
      result.current.handleIdle();

      // Assert
      expect(mockSetLastLayerId).toHaveBeenCalledWith("layer2");
    });

    it("should handle missing layers gracefully", () => {
      // Arrange
      mockMapGetStyle.mockReturnValue({ layers: undefined });
      const { result } = renderHook(() => useCityMapEventHandlers());

      // Act & Assert - should not throw
      expect(() => result.current.handleIdle()).not.toThrow();
      expect(mockSetLastLayerId).not.toHaveBeenCalled();
    });
  });
});
