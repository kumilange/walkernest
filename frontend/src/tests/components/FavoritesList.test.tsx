import type { FavoriteItem } from "@/types";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Simple mock functions without complex types
const mockHandleSelect = vi.fn();
const mockHandleDelete = vi.fn();
const mockSetFavItems = vi.fn();

// Mock data with explicit types
const mockFavItems: FavoriteItem[] = [
  {
    id: 1,
    name: "Home",
    city: "denver",
    feature: {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-105.0178, 39.7392],
      },
      properties: {},
    },
  },
  {
    id: 2,
    name: "Work",
    city: "boulder",
    feature: {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-105.2705, 40.015],
      },
      properties: {},
    },
  },
];

// Simple variable to control mock behavior
let currentFavItems = mockFavItems;
let currentSelectedId = 1;

// Mock hooks with simple implementations
vi.mock("@/features/map/stores/favoritesAtoms", () => ({
  useAtomFavItems: () => ({
    favItems: currentFavItems,
    setFavItems: mockSetFavItems,
  }),
}));

vi.mock("@/features/map/components/CardContent/favorites-list/use-event-handlers", () => ({
  __esModule: true,
  default: () => ({
    selectedId: currentSelectedId,
    handleSelect: mockHandleSelect,
    handleDelete: mockHandleDelete,
  }),
}));

// Simple utility mocks
vi.mock("@/utils/misc", () => ({
  capitalize: (str: string) => str.charAt(0).toUpperCase() + str.slice(1),
  cn: (...classes: (string | Record<string, boolean> | undefined)[]) => {
    return classes
      .filter(Boolean)
      .flatMap((cls) => {
        if (typeof cls === "string") return cls;
        if (typeof cls === "object" && cls !== null) {
          return Object.entries(cls)
            .filter(([_, value]) => Boolean(value))
            .map(([key]) => key);
        }
        return [];
      })
      .join(" ");
  },
}));

// Simple icon mock
vi.mock("lucide-react", () => ({
  Trash2: ({
    className,
    onClick,
  }: {
    className?: string;
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  }) => (
    // biome-ignore lint/a11y/useKeyWithClickEvents: test mock doesn't need keyboard events
    <div data-testid="mock-trash-icon" className={className} onClick={onClick}>
      Delete
    </div>
  ),
}));

// Simple MapLibre GL mock
vi.mock("maplibre-gl", () => ({
  LngLat: class {
    lng: number;
    lat: number;
    constructor(lng: number, lat: number) {
      this.lng = lng;
      this.lat = lat;
    }
  },
}));

// Import component after mocks
import FavoritesList from "@/features/map/components/CardContent/favorites-list";

describe("FavoritesList Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default state
    currentFavItems = mockFavItems;
    currentSelectedId = 1;
  });

  describe("when no favorites are available", () => {
    it("renders empty state message", () => {
      // Arrange
      currentFavItems = [];

      // Act
      render(<FavoritesList />);

      // Assert
      expect(screen.getByText("No favorites are added yet.")).toBeInTheDocument();
      expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });
  });

  describe("when favorites are available", () => {
    it("renders list of favorite items", () => {
      // Act
      render(<FavoritesList />);

      // Assert
      expect(screen.getByRole("list")).toBeInTheDocument();
      expect(screen.getAllByRole("listitem")).toHaveLength(2);
      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.getByText("Work")).toBeInTheDocument();
    });

    it("displays favorite names and cities correctly", () => {
      // Act
      render(<FavoritesList />);

      // Assert
      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.getByText("Work")).toBeInTheDocument();
      expect(screen.getByText("Denver")).toBeInTheDocument();
      expect(screen.getByText("Boulder")).toBeInTheDocument();
    });

    it("renders delete buttons for each favorite", () => {
      // Act
      render(<FavoritesList />);

      // Assert
      const deleteButtons = screen.getAllByTestId("mock-trash-icon");
      expect(deleteButtons).toHaveLength(2);
    });

    it("applies selected styling to the currently selected item", () => {
      // Act
      render(<FavoritesList />);

      // Assert
      const listItems = screen.getAllByRole("listitem");
      expect(listItems[0]).toHaveClass("bg-primary-lightGray");
      expect(listItems[1]).not.toHaveClass("bg-primary-lightGray");
    });
  });

  describe("user interactions", () => {
    it("calls handleSelect when favorite item is clicked", () => {
      // Act
      render(<FavoritesList />);
      fireEvent.click(screen.getByText("Home"));

      // Assert
      expect(mockHandleSelect).toHaveBeenCalledTimes(1);
      expect(mockHandleSelect).toHaveBeenCalledWith({
        e: expect.any(Object),
        id: 1,
        lngLat: expect.objectContaining({
          lng: -105.0178,
          lat: 39.7392,
        }),
      });
    });

    it("calls handleDelete when delete button is clicked", () => {
      // Act
      render(<FavoritesList />);
      const deleteButton = screen.getAllByTestId("mock-trash-icon")[0];
      fireEvent.click(deleteButton);

      // Assert
      expect(mockHandleDelete).toHaveBeenCalledTimes(1);
      expect(mockHandleDelete).toHaveBeenCalledWith({
        e: expect.any(Object),
        id: 1,
      });
    });
  });

  describe("edge cases", () => {
    it("handles single favorite item correctly", () => {
      // Arrange
      currentFavItems = [mockFavItems[0]];

      // Act
      render(<FavoritesList />);

      // Assert
      expect(screen.getAllByRole("listitem")).toHaveLength(1);
      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.queryByText("Work")).not.toBeInTheDocument();
    });

    it("handles favorites with no selected item", () => {
      // Arrange
      currentSelectedId = 0; // No item selected

      // Act
      render(<FavoritesList />);

      // Assert
      const listItems = screen.getAllByRole("listitem");
      expect(listItems[0]).not.toHaveClass("bg-primary-lightGray");
      expect(listItems[1]).not.toHaveClass("bg-primary-lightGray");
    });

    it("handles favorites with different selected item", () => {
      // Arrange
      currentSelectedId = 2; // Second item selected

      // Act
      render(<FavoritesList />);

      // Assert
      const listItems = screen.getAllByRole("listitem");
      expect(listItems[0]).not.toHaveClass("bg-primary-lightGray");
      expect(listItems[1]).toHaveClass("bg-primary-lightGray");
    });
  });
});
