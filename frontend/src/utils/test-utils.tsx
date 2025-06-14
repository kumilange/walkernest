import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";
import { type MockedFunction, vi } from "vitest";

// Create a test query client with disabled retries for faster tests
const createTestQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                staleTime: 0,
            },
            mutations: {
                retry: false,
            },
        },
    });

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
    queryClient?: QueryClient;
}

export function renderWithProviders(
    ui: ReactElement,
    {
        queryClient = createTestQueryClient(),
        ...renderOptions
    }: CustomRenderOptions = {}
) {
    function Wrapper({ children }: { children: React.ReactNode }) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    }

    return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Mock factory for common components
export const createMockComponent = (testId: string, displayName?: string) => {
    const MockComponent = ({ children, ...props }: { children?: React.ReactNode;[key: string]: unknown }) => (
        <div data-testid={testId} {...props}>
            {children}
        </div>
    );

    if (displayName) {
        MockComponent.displayName = displayName;
    }

    return MockComponent;
};

// Common mock implementations
export const mockStores = {
    useAtomCity: () => ({
        city: null,
        setCity: vi.fn(),
    }),
    useAtomRoute: () => ({
        route: null,
        setRoute: vi.fn(),
        startingPoint: null,
        setStartingPoint: vi.fn(),
        endingPoint: null,
        setEndingPoint: vi.fn(),
        isStartingPointSelecting: false,
        setIsStartingPointSelecting: vi.fn(),
        isEndingPointSelecting: false,
        setIsEndingPointSelecting: vi.fn(),
    }),
    useAtomMaxDistance: () => ({
        maxDistance: { park: 320, supermarket: 800, cafe: 800 },
        setMaxDistance: vi.fn(),
    }),
    useAtomIsAmenityOn: () => ({
        isAmenityOn: { park: true, supermarket: true, cafe: true },
        setIsAmenityOn: vi.fn(),
    }),
};

/**
 * Common test utilities and helpers
 */
export const testUtils = {
    /**
     * Creates a mock function with proper typing
     */
    createMockFn: <T extends (...args: any[]) => any>(
        implementation?: T
    ): MockedFunction<T> => {
        return vi.fn(implementation) as MockedFunction<T>;
    },

    /**
     * Creates mock coordinates for testing
     */
    createMockCoordinates: (lng = -105, lat = 40) => ({
        lng,
        lat,
    }),

    /**
     * Creates mock GeoJSON feature for testing
     */
    createMockFeature: (id = "test-feature", name = "Test Feature") => ({
        type: "Feature" as const,
        properties: { id, name },
        geometry: {
            type: "Point" as const,
            coordinates: [-105, 40],
        },
    }),

    /**
     * Waits for DOM updates to complete
     */
    waitForDOMUpdates: async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
    },
};

// Re-export everything from testing library
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";