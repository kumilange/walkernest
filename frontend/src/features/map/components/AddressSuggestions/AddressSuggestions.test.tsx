import type { AutocompleteResult } from "@/features/map/api";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AddressSuggestions from ".";

const mockSuggestions: AutocompleteResult[] = [
  {
    id: "1",
    displayName: "123 Main St, Anytown, USA",
    address: "123 Main St",
    city: "Anytown",
    country: "USA",
    coordinates: { lat: 34.0522, lng: -118.2437 },
  },
  {
    id: "2",
    displayName: "456 Oak Ave, Anytown, USA",
    address: "456 Oak Ave",
    city: "Anytown",
    country: "USA",
    coordinates: { lat: 34.0523, lng: -118.2438 },
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
      <AddressSuggestions suggestions={mockSuggestions} isLoading={false} onSelect={() => {}} />
    );
    expect(screen.getByText("123 Main St, Anytown, USA")).toBeInTheDocument();
    expect(screen.getByText("456 Oak Ave, Anytown, USA")).toBeInTheDocument();
  });

  it("calls onSelect with the correct suggestion when an item is clicked", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const handleSelect = vi.fn();
    render(
      <AddressSuggestions suggestions={mockSuggestions} isLoading={false} onSelect={handleSelect} />
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
      <AddressSuggestions suggestions={mockSuggestions} isLoading={false} onSelect={handleSelect} />
    );

    const commandList = screen.getByRole("listbox");
    commandList.focus();

    await user.keyboard("{enter}");
    vi.runAllTimers();

    expect(handleSelect).toHaveBeenCalledWith(mockSuggestions[0]);
  });

  it("renders loading skeletons when isLoading is true", () => {
    render(<AddressSuggestions suggestions={[]} isLoading={true} onSelect={() => {}} />);

    const skeletons = screen.getAllByRole("alert");
    expect(skeletons).toHaveLength(3);
  });

  it('renders "No results found." when there are no suggestions and not loading', () => {
    render(<AddressSuggestions suggestions={[]} isLoading={false} onSelect={() => {}} />);
    expect(screen.getByText("No results found.")).toBeInTheDocument();
  });
});
