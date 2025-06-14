import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CityCombobox from "./index";

// Mock event handlers
const mockHandleSearch = vi.fn();
const mockSetCity = vi.fn();

// Mock state
let mockCity: string | null = null;

// Mock city atom
vi.mock("@/stores", () => ({
    useAtomCity: vi.fn().mockImplementation(() => ({
        city: mockCity,
        setCity: mockSetCity,
    })),
}));

// Mock constants
vi.mock("@/constants", () => ({
    CITY_LIST_ARRAY: [
        {
            id: 1,
            value: "denver",
            label: "Denver",
            geometry: {
                type: "Polygon",
                coordinates: [
                    [
                        [-105, 39],
                        [-104, 39],
                        [-104, 40],
                        [-105, 40],
                        [-105, 39],
                    ],
                ],
            },
        },
        {
            id: 2,
            value: "boulder",
            label: "Boulder",
            geometry: {
                type: "Polygon",
                coordinates: [
                    [
                        [-106, 40],
                        [-105, 40],
                        [-105, 41],
                        [-106, 41],
                        [-106, 40],
                    ],
                ],
            },
        },
        {
            id: 3,
            value: "austin",
            label: "Austin",
            geometry: {
                type: "Polygon",
                coordinates: [
                    [
                        [-98, 30],
                        [-97, 30],
                        [-97, 31],
                        [-98, 31],
                        [-98, 30],
                    ],
                ],
            },
        },
    ],
}));

// Mock event handlers
vi.mock("./use-event-handlers", () => ({
    default: () => ({
        handleSearch: mockHandleSearch,
    }),
}));

// Mock UI components
vi.mock("@/components/ui/button", () => ({
    Button: ({ children, ...props }: { children: React.ReactNode;[key: string]: unknown }) => (
        <button type="button" data-testid="combobox-trigger" {...props}>
            {children}
        </button>
    ),
}));

vi.mock("@/components/ui/popover", () => ({
    Popover: ({
        children,
        open,
        onOpenChange,
    }: {
        children: React.ReactNode;
        open?: boolean;
        onOpenChange?: (open: boolean) => void;
    }) => (
        <div data-testid="popover" data-open={open}>
            {children}
            <button
                type="button"
                data-testid="toggle-popover"
                onClick={() => onOpenChange?.(!open)}
            >
                Toggle
            </button>
        </div>
    ),
    PopoverTrigger: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="popover-trigger">{children}</div>
    ),
    PopoverContent: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="popover-content">{children}</div>
    ),
}));

vi.mock("@/components/ui/command", () => ({
    Command: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="command">{children}</div>
    ),
    CommandInput: ({ placeholder }: { placeholder?: string }) => (
        <input data-testid="command-input" placeholder={placeholder} />
    ),
    CommandList: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="command-list">{children}</div>
    ),
    CommandEmpty: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="command-empty">{children}</div>
    ),
    CommandGroup: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="command-group">{children}</div>
    ),
    CommandItem: ({
        children,
        value,
        onSelect,
    }: {
        children: React.ReactNode;
        value?: string;
        onSelect?: (value: string) => void;
    }) => (
        <div
            data-testid={`command-item-${value}`}
            role="option"
            onClick={() => onSelect?.(value || "")}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    onSelect?.(value || "");
                }
            }}
            tabIndex={0}
        >
            {children}
        </div>
    ),
}));

vi.mock("@/utils/misc", () => ({
    cn: (...classes: unknown[]) => classes.filter(Boolean).join(" "),
}));

vi.mock("lucide-react", () => ({
    Check: ({ className }: { className?: string }) => (
        <div data-testid="check-icon" className={className}>
            ✓
        </div>
    ),
    ChevronsUpDown: ({ className }: { className?: string }) => (
        <div data-testid="chevrons-icon" className={className}>
            ⇅
        </div>
    ),
}));

describe("CityCombobox", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockCity = null;
    });

    describe("when no city is selected", () => {
        it("should display placeholder text to user", () => {
            // Act
            render(<CityCombobox />);

            // Assert
            expect(screen.getByText("Select city...")).toBeInTheDocument();
            expect(screen.getByTestId("chevrons-icon")).toBeInTheDocument();
        });

        it("should allow user to select a city", async () => {
            // Arrange
            const user = userEvent.setup();
            render(<CityCombobox />);

            // Act
            await user.click(screen.getByTestId("combobox-trigger"));
            await user.click(screen.getByTestId("command-item-denver"));

            // Assert
            expect(mockHandleSearch).toHaveBeenCalledWith(
                expect.objectContaining({
                    value: "denver",
                    label: "Denver",
                    id: 1,
                    geometry: expect.any(Object),
                })
            );
        });
    });

    describe("when city is selected", () => {
        beforeEach(() => {
            mockCity = "denver";
        });

        it("should display selected city name to user", () => {
            // Act
            render(<CityCombobox />);

            // Assert
            expect(screen.getByTestId("combobox-trigger")).toHaveTextContent("Denver");
        });

        it("should not trigger search when selecting same city", async () => {
            // Arrange
            const user = userEvent.setup();
            render(<CityCombobox />);

            // Act
            await user.click(screen.getByTestId("combobox-trigger"));
            await user.click(screen.getByTestId("command-item-denver"));

            // Assert
            expect(mockHandleSearch).not.toHaveBeenCalled();
        });

        it("should prioritize selected city in dropdown list", () => {
            // Arrange
            mockCity = "boulder";

            // Act
            render(<CityCombobox />);

            // Assert
            const commandItems = screen.getAllByTestId(/command-item/);
            expect(commandItems[0]).toHaveAttribute("data-testid", "command-item-boulder");
        });
    });

    describe("when user interacts with dropdown", () => {
        it("should provide search functionality", () => {
            // Act
            render(<CityCombobox />);

            // Assert
            expect(screen.getByTestId("command-input")).toHaveAttribute(
                "placeholder",
                "Search city..."
            );
        });

        it("should show all available cities as options", () => {
            // Act
            render(<CityCombobox />);

            // Assert
            expect(screen.getByTestId("command-item-denver")).toBeInTheDocument();
            expect(screen.getByTestId("command-item-boulder")).toBeInTheDocument();
            expect(screen.getByTestId("command-item-austin")).toBeInTheDocument();
        });

        it("should handle keyboard navigation", async () => {
            // Arrange
            const user = userEvent.setup();
            render(<CityCombobox />);

            // Act
            const denverOption = screen.getByTestId("command-item-denver");
            denverOption.focus();
            await user.keyboard("{Enter}");

            // Assert
            expect(mockHandleSearch).toHaveBeenCalledWith(
                expect.objectContaining({
                    value: "denver",
                    label: "Denver",
                })
            );
        });
    });

    describe("when changing cities", () => {
        it("should trigger map bounds update for new city", async () => {
            // Arrange
            const user = userEvent.setup();
            mockCity = "austin";
            render(<CityCombobox />);

            // Act
            await user.click(screen.getByTestId("combobox-trigger"));
            await user.click(screen.getByTestId("command-item-denver"));

            // Assert
            expect(mockHandleSearch).toHaveBeenCalledWith(
                expect.objectContaining({
                    value: "denver",
                    label: "Denver",
                    geometry: expect.any(Object),
                })
            );
        });
    });
}); 