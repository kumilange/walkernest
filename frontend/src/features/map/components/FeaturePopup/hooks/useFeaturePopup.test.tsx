import { act, renderHook, waitFor } from "@testing-library/react";
import type { LngLat } from "react-map-gl/maplibre";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useFeaturePopup from "./useFeaturePopup";

// Mock the favorites atoms
const mockSetIsFavPopupOpen = vi.fn();

vi.mock("@/features/map/stores/favoritesAtoms", () => ({
  useAtomIsFavPopupOpen: () => ({
    isFavPopupOpen: false,
    setIsFavPopupOpen: mockSetIsFavPopupOpen,
  }),
}));

describe("useFeaturePopup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("should initialize with default values", () => {
      // Arrange & Act
      const { result } = renderHook(() => useFeaturePopup());

      // Assert
      expect(result.current.lngLat).toBeNull();
      expect(result.current.properties).toBeNull();
      expect(result.current.isPopupOpen).toBe(false);
      expect(result.current.isFavPopupOpen).toBe(false);
    });
  });

  describe("state updates", () => {
    it("should update lngLat when setLngLat is called", async () => {
      // Arrange
      const { result } = renderHook(() => useFeaturePopup());
      const mockLngLat = { lng: -105, lat: 40 } as LngLat;

      // Act
      act(() => {
        result.current.setLngLat(mockLngLat);
      });

      // Assert
      await waitFor(() => {
        expect(result.current.lngLat).toEqual(mockLngLat);
      });
    });

    it("should update popup open state when setIsPopupOpen is called", async () => {
      // Arrange
      const { result } = renderHook(() => useFeaturePopup());

      // Act
      act(() => {
        result.current.setIsPopupOpen(true);
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isPopupOpen).toBe(true);
      });
    });

    it("should update properties when setProperties is called", async () => {
      // Arrange
      const { result } = renderHook(() => useFeaturePopup());
      const mockProperties = { id: "123", name: "Test Location" };

      // Act
      act(() => {
        result.current.setProperties(mockProperties);
      });

      // Assert
      await waitFor(() => {
        expect(result.current.properties).toEqual(mockProperties);
      });
    });
  });

  describe("popup close handling", () => {
    it("should reset all state when handlePopupClose is called", async () => {
      // Arrange
      const { result } = renderHook(() => useFeaturePopup());
      const mockLngLat = { lng: -105, lat: 40 } as LngLat;
      const mockProperties = { id: "123", name: "Test Location" };

      // Set initial state
      act(() => {
        result.current.setLngLat(mockLngLat);
        result.current.setIsPopupOpen(true);
        result.current.setProperties(mockProperties);
      });

      // Verify initial state is set
      await waitFor(() => {
        expect(result.current.lngLat).toEqual(mockLngLat);
        expect(result.current.isPopupOpen).toBe(true);
        expect(result.current.properties).toEqual(mockProperties);
      });

      // Act
      act(() => {
        result.current.handlePopupClose();
      });

      // Assert
      await waitFor(() => {
        expect(result.current.lngLat).toBeNull();
        expect(result.current.properties).toBeNull();
        expect(result.current.isPopupOpen).toBe(false);
        expect(mockSetIsFavPopupOpen).toHaveBeenCalledWith(false);
      });
    });
  });
});
