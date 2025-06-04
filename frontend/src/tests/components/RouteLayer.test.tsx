import RouteLayer from "@/features/map/layers/custom-layer/route-layer";
import { getAnimatedSlice } from "@/features/map/layers/helper";
import type { Route } from "@/types";
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock requestAnimationFrame and related timing functions
const mockRAF = vi.fn(() => {
  return 1;
});

const mockCancelRAF = vi.fn();

global.requestAnimationFrame = mockRAF;
global.cancelAnimationFrame = mockCancelRAF;

// Mock Date.now for predictable timing
const mockDateNow = vi.fn();
global.Date.now = mockDateNow;

describe("RouteLayer Component", () => {
  const mockRoute: Route = {
    geometry: {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [139.7671, 35.6812],
          [139.7681, 35.6822],
          [139.7691, 35.6832],
          [139.7701, 35.6842],
          [139.7711, 35.6852],
        ],
      },
      properties: {},
      coordinates: [
        [139.7671, 35.6812],
        [139.7681, 35.6822],
        [139.7691, 35.6832],
        [139.7701, 35.6842],
        [139.7711, 35.6852],
      ],
    },
    distance: 1000,
    duration: 300,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockDateNow.mockReturnValue(1000); // Start time
  });

  describe("getAnimatedSlice helper function", () => {
    it("returns empty array for progress <= 0", () => {
      const coords: [number, number][] = [
        [0, 0],
        [1, 1],
        [2, 2],
      ];
      expect(getAnimatedSlice(0, coords)).toEqual([]);
      expect(getAnimatedSlice(-0.5, coords)).toEqual([]);
    });

    it("returns full array for progress >= 1", () => {
      const coords: [number, number][] = [
        [0, 0],
        [1, 1],
        [2, 2],
      ];
      expect(getAnimatedSlice(1, coords)).toEqual(coords);
      expect(getAnimatedSlice(1.5, coords)).toEqual(coords);
    });

    it("returns empty array for coordinates with less than 2 points", () => {
      expect(getAnimatedSlice(0.5, [])).toEqual([]);
      expect(getAnimatedSlice(0.5, [[0, 0]])).toEqual([]);
    });

    it("returns at least 2 points for valid progress", () => {
      const coords: [number, number][] = [
        [0, 0],
        [1, 1],
        [2, 2],
        [3, 3],
        [4, 4],
      ];

      // Very small progress should still return at least 2 points
      const result = getAnimatedSlice(0.1, coords);
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result).toEqual([
        [0, 0],
        [1, 1],
      ]);
    });

    it("correctly slices coordinates based on progress", () => {
      const coords: [number, number][] = [
        [0, 0],
        [1, 1],
        [2, 2],
        [3, 3],
        [4, 4],
      ];

      // 50% progress should return first 3 points (ceil(0.5 * 5) = 3)
      expect(getAnimatedSlice(0.5, coords)).toEqual([
        [0, 0],
        [1, 1],
        [2, 2],
      ]);

      // 75% progress should return first 4 points (ceil(0.75 * 5) = 4)
      expect(getAnimatedSlice(0.75, coords)).toEqual([
        [0, 0],
        [1, 1],
        [2, 2],
        [3, 3],
      ]);
    });
  });

  describe("Component rendering", () => {
    it("renders without crashing with valid route", () => {
      expect(() => {
        render(<RouteLayer route={mockRoute} />);
      }).not.toThrow();
    });

    it("renders without crashing with null route", () => {
      expect(() => {
        render(<RouteLayer route={null} />);
      }).not.toThrow();
    });
  });

  describe("Animation lifecycle and edge cases", () => {
    it("renders correctly with valid route", () => {
      // Act
      const { container } = render(<RouteLayer route={mockRoute} />);

      // Assert - component renders without errors
      expect(container).toBeInTheDocument();
    });

    it("handles route with insufficient coordinates gracefully", () => {
      // Arrange
      const invalidRoute: Route = {
        ...mockRoute,
        geometry: {
          ...mockRoute.geometry,
          geometry: {
            type: "LineString",
            coordinates: [[139.7671, 35.6812]], // Only 1 point
          },
          coordinates: [[139.7671, 35.6812]], // Only 1 point
        },
      };

      // Act & Assert - should not throw
      expect(() => {
        render(<RouteLayer route={invalidRoute} />);
      }).not.toThrow();
    });

    it("handles null route gracefully", () => {
      // Act & Assert - should not throw
      expect(() => {
        render(<RouteLayer route={null} />);
      }).not.toThrow();
    });

    it("handles component unmount gracefully", () => {
      // Arrange
      const { unmount } = render(<RouteLayer route={mockRoute} />);

      // Act & Assert - should not throw
      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  describe("Component state management", () => {
    it("handles component re-rendering correctly", () => {
      // Arrange
      const { rerender } = render(<RouteLayer route={mockRoute} />);

      // Act & Assert - should not throw on rerender
      expect(() => {
        rerender(<RouteLayer route={mockRoute} />);
      }).not.toThrow();
    });

    it("handles route prop changes", () => {
      // Arrange
      const { rerender } = render(<RouteLayer route={mockRoute} />);

      // Act & Assert - changing route should not throw
      expect(() => {
        rerender(<RouteLayer route={null} />);
        rerender(<RouteLayer route={mockRoute} />);
      }).not.toThrow();
    });
  });
});
