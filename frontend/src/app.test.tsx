import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "./app";

// Mock components to focus on App's behavior
vi.mock("@/components/ui/toaster", () => ({
  Toaster: () => <div data-testid="toaster" />,
}));

vi.mock("@/components/error/error-boundary", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  ),
}));

vi.mock("@/features/map/components/CityMap", () => ({
  default: () => <div data-testid="city-map" />,
}));

describe("App", () => {
  describe("when application loads", () => {
    it("should render main application components", () => {
      // Act
      render(<App />);

      // Assert
      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
      expect(screen.getByTestId("toaster")).toBeInTheDocument();
      expect(screen.getByTestId("city-map")).toBeInTheDocument();
    });

    it("should wrap content in error boundary for error handling", () => {
      // Act
      render(<App />);

      // Assert
      const errorBoundary = screen.getByTestId("error-boundary");
      const cityMap = screen.getByTestId("city-map");

      expect(errorBoundary).toContainElement(cityMap);
    });

    it("should provide toast notifications", () => {
      // Act
      render(<App />);

      // Assert
      expect(screen.getByTestId("toaster")).toBeInTheDocument();
    });
  });
});
