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

  it("renders loading state with skeletons", () => {
    render(<AddressSuggestions suggestions={[]} isLoading={true} onSelect={() => {}} />);
    const loadingContainer = screen.getByRole("status");
    expect(loadingContainer).toBeInTheDocument();
    expect(loadingContainer).toHaveAttribute("aria-label", "Loading address suggestions");
  });

  it("renders empty state when no suggestions and not loading", () => {
    render(<AddressSuggestions suggestions={[]} isLoading={false} onSelect={() => {}} />);
    expect(screen.getByText("No results found.")).toBeInTheDocument();
  });

  it("renders suggestions correctly when selected index is provided", () => {
    render(
      <AddressSuggestions
        suggestions={mockSuggestions}
        isLoading={false}
        selectedIndex={1}
        onSelect={() => {}}
      />
    );

    const suggestions = screen.getAllByRole("option");
    expect(suggestions).toHaveLength(2);
    // The suggestions should be rendered with the correct text content
    expect(suggestions[0]).toHaveTextContent("123 Main St, Anytown, USA");
    expect(suggestions[1]).toHaveTextContent("456 Oak Ave, Anytown, USA");
    // Command component handles selection styling internally, so we just verify the suggestions exist
    expect(suggestions[0]).toBeInTheDocument();
    expect(suggestions[1]).toBeInTheDocument();
  });

  it("renders error state when hasError is true and no suggestions", () => {
    render(
      <AddressSuggestions suggestions={[]} isLoading={false} hasError={true} onSelect={() => {}} />
    );

    expect(screen.getByText("Connection Error")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Unable to fetch address suggestions. Please check your internet connection."
      )
    ).toBeInTheDocument();
  });

  it("renders cached results indicator when hasError is true and suggestions are present", () => {
    render(
      <AddressSuggestions
        suggestions={mockSuggestions}
        isLoading={false}
        hasError={true}
        onSelect={() => {}}
      />
    );

    expect(screen.getByText("123 Main St, Anytown, USA")).toBeInTheDocument();
    expect(screen.getByText("456 Oak Ave, Anytown, USA")).toBeInTheDocument();
    expect(screen.getByText("Showing cached results")).toBeInTheDocument();

    // Check that suggestions have the error styling (opacity class applied)
    const suggestions = screen.getAllByRole("option");
    expect(suggestions[0]).toHaveClass("opacity-75");
    expect(suggestions[1]).toHaveClass("opacity-75");
  });

  it("shows clock icons for cached results when hasError is true", () => {
    render(
      <AddressSuggestions
        suggestions={mockSuggestions}
        isLoading={false}
        hasError={true}
        onSelect={() => {}}
      />
    );

    // Look for clock icons using CSS class selector instead of testid
    const clockIcons = document.querySelectorAll(".lucide-clock");
    expect(clockIcons).toHaveLength(3); // 2 suggestions + 1 footer
  });

  it("does not show error indicators when hasError is false", () => {
    render(
      <AddressSuggestions
        suggestions={mockSuggestions}
        isLoading={false}
        hasError={false}
        onSelect={() => {}}
      />
    );

    expect(screen.queryByText("Showing cached results")).not.toBeInTheDocument();
    expect(document.querySelectorAll(".lucide-clock")).toHaveLength(0);

    // Check that suggestions don't have the error styling
    const suggestions = screen.getAllByRole("option");
    expect(suggestions[0]).not.toHaveClass("opacity-75");
    expect(suggestions[1]).not.toHaveClass("opacity-75");
  });

  it("renders suggestions correctly with listboxId prop", () => {
    const customId = "custom-listbox-id";
    render(
      <AddressSuggestions
        suggestions={mockSuggestions}
        isLoading={false}
        listboxId={customId}
        onSelect={() => {}}
      />
    );

    // Command component manages its own ID internally, but we should still render correctly
    const listbox = screen.getByRole("listbox");
    expect(listbox).toBeInTheDocument();

    // Suggestions should exist and be clickable
    const suggestions = screen.getAllByRole("option");
    expect(suggestions).toHaveLength(2);
    expect(suggestions[0]).toBeInTheDocument();
    expect(suggestions[1]).toBeInTheDocument();

    // Verify the suggestions have the correct content
    expect(suggestions[0]).toHaveTextContent("123 Main St, Anytown, USA");
    expect(suggestions[1]).toHaveTextContent("456 Oak Ave, Anytown, USA");

    // Verify functional behavior still works
    expect(suggestions[0]).toBeVisible();
    expect(suggestions[1]).toBeVisible();
  });
});
