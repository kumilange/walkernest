import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import useSyncFavorites from "@/components/city-map/hooks/use-sync-favorites";

// Declare a type for our mock favorite
interface MockFavorite {
  id: string;
  name: string;
  city: string;
  feature: {
    type: string;
    properties: { id: string };
    geometry: {
      type: string;
      coordinates: number[];
    };
  };
}

// Define mock data outside, but we'll only reference it inside the mock functions
const FAVORITES_MOCK_DATA: MockFavorite[] = [
  {
    id: "1",
    name: "Home",
    city: "Denver",
    feature: {
      type: "Feature",
      properties: { id: "1" },
      geometry: {
        type: "Point",
        coordinates: [-104.9, 39.7],
      },
    },
  },
];

// Track mock state between tests
let currentFavItems: MockFavorite[] = [];
const mockSetFavItems = vi.fn().mockImplementation((items) => {
  currentFavItems = items;
});

// Create a getter to access our mock data
const getMockFavorites = () => [...FAVORITES_MOCK_DATA];

// Mock dependencies with proper hoisting
vi.mock("@/atoms", () => {
  return {
    useAtomFavItems: () => ({
      favItems: currentFavItems,
      setFavItems: mockSetFavItems,
    }),
  };
});

vi.mock("@/lib/localstorage", () => {
  return {
    getLocalStorageList: vi.fn().mockImplementation(() => getMockFavorites()),
  };
});

describe("useSyncFavorites hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset state between tests
    currentFavItems = [];
  });

  it("syncs favorites from localStorage on initial render", async () => {
    // Arrange & Act
    renderHook(() => useSyncFavorites());

    // Assert - use waitFor to properly handle the asynchronous useEffect
    await waitFor(() => {
      expect(mockSetFavItems).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: "1",
            name: "Home",
            city: "Denver",
          }),
        ]),
      );
    });
  });

  it("does not sync favorites if localStorage and state are already identical", async () => {
    // Arrange - set current state to match localStorage
    currentFavItems = getMockFavorites();

    // Act
    renderHook(() => useSyncFavorites());

    // Assert - we should wait a tick to ensure useEffect has run
    await waitFor(() => {
      expect(mockSetFavItems).not.toHaveBeenCalled();
    });
  });
});
