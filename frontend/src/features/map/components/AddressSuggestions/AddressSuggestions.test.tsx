import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AddressSuggestions, { type AutocompleteResult } from ".";

const mockSuggestions: AutocompleteResult[] = [
    {
        place_id: 1,
        display_name: "123 Main St, Anytown, USA",
        lat: "34.0522",
        lon: "-118.2437",
    },
    {
        place_id: 2,
        display_name: "456 Oak Ave, Anytown, USA",
        lat: "34.0523",
        lon: "-118.2438",
    },
];

describe("AddressSuggestions", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("renders a list of suggestions when not loading and suggestions are present", () => {
        render(
            <AddressSuggestions
                suggestions={mockSuggestions}
                isLoading={false}
                onSelect={() => { }}
                inputValue="Any"
            />,
        );
        expect(screen.getByText("123 Main St, Anytown, USA")).toBeInTheDocument();
        expect(screen.getByText("456 Oak Ave, Anytown, USA")).toBeInTheDocument();
    });

    it("calls onSelect with the correct suggestion when an item is clicked", async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        const handleSelect = vi.fn();
        render(
            <AddressSuggestions
                suggestions={mockSuggestions}
                isLoading={false}
                onSelect={handleSelect}
                inputValue="Any"
            />,
        );

        const firstSuggestion = screen.getByText("123 Main St, Anytown, USA");
        await user.click(firstSuggestion);
        vi.runAllTimers();

        expect(handleSelect).toHaveBeenCalledWith(mockSuggestions[0]);
    });

    it("calls onSelect with the correct suggestion when Enter is pressed", async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        const handleSelect = vi.fn();

        render(
            <AddressSuggestions
                suggestions={mockSuggestions}
                isLoading={false}
                onSelect={handleSelect}
                inputValue="Any"
            />,
        );

        const commandList = screen.getByRole("listbox");
        commandList.focus();

        await user.keyboard("{enter}");
        vi.runAllTimers();

        expect(handleSelect).toHaveBeenCalledWith(mockSuggestions[0]);
    });

    it("renders loading skeletons when isLoading is true", () => {
        render(
            <AddressSuggestions
                suggestions={[]}
                isLoading={true}
                onSelect={() => { }}
                inputValue="Any"
            />,
        );

        // Skeletons have a role of "alert" now
        const skeletons = screen.getAllByRole("alert");
        expect(skeletons).toHaveLength(3);
    });

    it('renders "No addresses found." when there are no suggestions and not loading', () => {
        render(
            <AddressSuggestions
                suggestions={[]}
                isLoading={false}
                onSelect={() => { }}
                inputValue="NonExistent"
            />,
        );
        expect(screen.getByText("No addresses found.")).toBeInTheDocument();
    });

    it("renders nothing if the inputValue is less than 3 characters long", () => {
        const { container } = render(
            <AddressSuggestions
                suggestions={mockSuggestions}
                isLoading={false}
                onSelect={() => { }}
                inputValue="An"
            />,
        );
        expect(container).toBeEmptyDOMElement();
    });
}); 