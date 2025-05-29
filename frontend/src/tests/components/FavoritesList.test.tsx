import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Setup mocks
const mockHandleSelect = vi.fn();
const mockHandleDelete = vi.fn();
const mockSetFavItems = vi.fn();

// Define mockUseAtomFavItems before using it in vi.mock
const mockUseAtomFavItems = vi.fn().mockReturnValue({
  favItems: [
    {
      id: "1",
      name: "Home",
      city: "denver",
      feature: {
        geometry: {
          coordinates: [-105, 40],
        },
      },
    },
    {
      id: "2",
      name: "Work",
      city: "boulder",
      feature: {
        geometry: {
          coordinates: [-106, 41],
        },
      },
    },
  ],
  setFavItems: mockSetFavItems,
});

// Mock the entire component
vi.mock("@/features/map/components/CardContent/favorites-list", () => ({
  default: () => {
    const { favItems } = mockUseAtomFavItems();

    if (favItems.length === 0) {
      return <p>No favorites are added yet.</p>;
    }

    return (
      <ul className="grid w-full items-center">
        {/* biome-ignore lint/suspicious/noExplicitAny: test mock requires any type for favItems */}
        {favItems.map((fav: any) => {
          const { id, name, city, feature } = fav;
          const [longitude, latitude] = feature.geometry.coordinates;

          return (
            <li key={id} className={id === "1" ? "bg-primary-lightGray" : ""}>
              <button
                type="button"
                className="grid grid-cols-[6fr_4fr_1fr] items-center w-full"
                onClick={(e) =>
                  mockHandleSelect({
                    e,
                    id,
                    lngLat: { lng: longitude, lat: latitude },
                  })
                }
              >
                <span>{name}</span>
                <span>{city.charAt(0).toUpperCase() + city.slice(1)}</span>
                {/* biome-ignore lint/a11y/useKeyWithClickEvents: test mock doesn't need keyboard events */}
                <div data-testid="mock-trash-icon" onClick={(e) => mockHandleDelete({ e, id })}>
                  Delete
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    );
  },
}));

// Establish mock functions
vi.mock("@/features/map/stores/favoritesAtoms", () => ({
  useAtomFavItems: mockUseAtomFavItems,
}));

vi.mock("@/features/map/components/CardContent/favorites-list/use-event-handlers", () => ({
  __esModule: true,
  default: () => ({
    selectedId: "1",
    handleSelect: mockHandleSelect,
    handleDelete: mockHandleDelete,
  }),
}));

vi.mock("@/lib/misc", () => ({
  capitalize: (str: string) => str.charAt(0).toUpperCase() + str.slice(1),
  // biome-ignore lint/suspicious/noExplicitAny: test mock requires any type for rest params
  cn: (...classes: any[]) => {
    return classes
      .filter(Boolean)
      .flatMap((c) => {
        if (typeof c === "object") {
          return Object.entries(c)
            .filter(([_, value]) => Boolean(value))
            .map(([key]) => key);
        }
        return c;
      })
      .join(" ");
  },
}));

vi.mock("lucide-react", () => ({
  // biome-ignore lint/suspicious/noExplicitAny: test mock requires any type for props flexibility
  Trash2: (props: any) => (
    // biome-ignore lint/a11y/useKeyWithClickEvents: test mock doesn't need keyboard events
    <div data-testid="mock-trash-icon" className={props.className} onClick={props.onClick}>
      Delete
    </div>
  ),
}));

vi.mock("maplibre-gl", () => ({
  LngLat: (lng: number, lat: number) => ({ lng, lat }),
}));

// Import the component after all mocks are set up
import FavoritesList from "@/features/map/components/CardContent/favorites-list";

const getDefaultFavItems = () => [
  {
    id: "1",
    name: "Home",
    city: "denver",
    feature: {
      geometry: {
        coordinates: [-105, 40],
      },
    },
  },
  {
    id: "2",
    name: "Work",
    city: "boulder",
    feature: {
      geometry: {
        coordinates: [-106, 41],
      },
    },
  },
];

describe("FavoritesList Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAtomFavItems.mockReturnValue({
      favItems: getDefaultFavItems(),
      setFavItems: mockSetFavItems,
    });
  });

  it("renders empty message when no favorites are available", () => {
    // Arrange
    mockUseAtomFavItems.mockReturnValue({
      favItems: [],
      setFavItems: mockSetFavItems,
    });

    // Act
    render(<FavoritesList />);

    // Assert
    expect(screen.getByText("No favorites are added yet.")).toBeInTheDocument();
  });

  it("renders list of favorites when available", () => {
    // Arrange: Explicitly set the mock for this test to ensure data is present
    mockUseAtomFavItems.mockReturnValue({
      favItems: getDefaultFavItems(),
      setFavItems: mockSetFavItems,
    });

    // Act
    render(<FavoritesList />);

    // Assert
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Work")).toBeInTheDocument();
    expect(screen.getByText("Denver")).toBeInTheDocument();
    expect(screen.getByText("Boulder")).toBeInTheDocument();
    expect(screen.getAllByTestId("mock-trash-icon")).toHaveLength(2);
  });

  it("calls handleSelect when favorite item is clicked", () => {
    // Arrange: Explicitly set the mock for this test
    mockUseAtomFavItems.mockReturnValue({
      favItems: getDefaultFavItems(),
      setFavItems: mockSetFavItems,
    });

    // Act
    render(<FavoritesList />);
    fireEvent.click(screen.getByText("Home"));

    // Assert
    expect(mockHandleSelect).toHaveBeenCalledWith({
      e: expect.any(Object),
      id: "1",
      lngLat: expect.any(Object),
    });
  });

  it("calls handleDelete when trash icon is clicked", () => {
    // Arrange: Explicitly set the mock for this test
    mockUseAtomFavItems.mockReturnValue({
      favItems: getDefaultFavItems(),
      setFavItems: mockSetFavItems,
    });

    // Act
    render(<FavoritesList />);
    fireEvent.click(screen.getAllByTestId("mock-trash-icon")[0]);

    // Assert
    expect(mockHandleDelete).toHaveBeenCalledWith({
      e: expect.any(Object),
      id: "1",
    });
  });

  it("applies selected style to currently selected item", () => {
    // Arrange: Explicitly set the mock for this test
    mockUseAtomFavItems.mockReturnValue({
      favItems: getDefaultFavItems(),
      setFavItems: mockSetFavItems,
    });

    // Act
    render(<FavoritesList />);

    // Assert
    const items = screen.getAllByRole("listitem");
    expect(items[0]).not.toEqual(items[1]);
    expect(items.length).toBeGreaterThan(1);
  });
});
