import Header from "@/layouts/header";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mocks
vi.mock("@/layouts/header/components/Heading", () => ({
  default: () => <div data-testid="mock-heading">Heading Component</div>,
}));

vi.mock("@/features/map/components/MenuBar", () => ({
  default: () => <div data-testid="mock-menu-bar">Menu Bar Component</div>,
}));

describe("Header Component", () => {
  it("renders correctly with all expected elements", () => {
    // Act
    render(<Header />);

    // Assert
    const headerElement = screen.getByRole("banner");
    expect(headerElement).toBeInTheDocument();
    expect(screen.getByTestId("mock-heading")).toBeInTheDocument();
    expect(screen.getByTestId("mock-menu-bar")).toBeInTheDocument();
  });
});
