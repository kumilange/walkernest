import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useSyncFavorites from "./useSyncFavorites";

// Mock favorite item type
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

const MOCK_FAVORITES: MockFavorite[] = [
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

// Mock dependencies
vi.mock("@/features/map/stores/favoritesAtoms", () => ({
    useAtomFavItems: () => ({
        favItems: currentFavItems,
        setFavItems: mockSetFavItems,
    }),
}));

vi.mock("@/utils/localstorage", () => ({
    getLocalStorageList: vi.fn().mockImplementation(() => [...MOCK_FAVORITES]),
}));

describe("useSyncFavorites", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        currentFavItems = [];
    });

    describe("initial sync", () => {
        it("should sync favorites from localStorage on initial render", async () => {
            // Arrange & Act
            renderHook(() => useSyncFavorites());

            // Assert
            await waitFor(() => {
                expect(mockSetFavItems).toHaveBeenCalledWith(
                    expect.arrayContaining([
                        expect.objectContaining({
                            id: "1",
                            name: "Home",
                            city: "Denver",
                        }),
                    ])
                );
            });
        });
    });

    describe("state comparison", () => {
        it("should not sync when localStorage and state are identical", async () => {
            // Arrange - set current state to match localStorage
            currentFavItems = [...MOCK_FAVORITES];

            // Act
            renderHook(() => useSyncFavorites());

            // Assert - wait a tick to ensure useEffect has run
            await waitFor(() => {
                expect(mockSetFavItems).not.toHaveBeenCalled();
            });
        });
    });
}); 