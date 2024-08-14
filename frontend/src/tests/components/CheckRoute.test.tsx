import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CheckRoute from '@/components/card-content/check-route';
import { useCheckRoutes } from '@/hooks';
import { LngLat } from 'react-map-gl/maplibre';

// Mock implementations
const mockSetStartingPoint = vi.fn();
const mockSetEndingPoint = vi.fn();
const mockSetIsStartingPointSelecting = vi.fn();
const mockSetIsEndingPointSelecting = vi.fn();
const mockReversePoints = vi.fn();
const mockSetRoute = vi.fn();
const mockSetAnimatedRoute = vi.fn();
const mockClearAllRouteStates = vi.fn();
const mockHandleAddressName = vi.fn();
const mockHandleFitBoundsForRoute = vi.fn();

// Create mock point objects
const mockStartingPoint = {
	lngLat: { lng: -105, lat: 40 } as LngLat,
	name: 'Starting Location'
};

const mockEndingPoint = {
	lngLat: { lng: -106, lat: 41 } as LngLat,
	name: 'Ending Location'
};

// Mock hooks
vi.mock('@/hooks', () => ({
	useCheckRoutes: vi.fn().mockImplementation(() => ({
		route: null,
		animatedRoute: null,
		startingPoint: null,
		endingPoint: null,
		isBothSelected: false,
		isSelectingPoint: false,
		isStartingPointSelecting: false,
		isEndingPointSelecting: false,
		setRoute: mockSetRoute,
		animateRoute: vi.fn(),
		setAnimatedRoute: mockSetAnimatedRoute,
		setStartingPoint: mockSetStartingPoint,
		setEndingPoint: mockSetEndingPoint,
		setIsStartingPointSelecting: mockSetIsStartingPointSelecting,
		setIsEndingPointSelecting: mockSetIsEndingPointSelecting,
		clearAllRouteStates: mockClearAllRouteStates,
		reversePoints: mockReversePoints,
		handleAddressName: mockHandleAddressName,
		handleFitBoundsForRoute: mockHandleFitBoundsForRoute
	}))
}));

vi.mock('@/components/card-content/check-route/select-point', () => ({
	default: ({ isStarting, point, setPoint, isPointSelecting, setIsPointSelecting }: any) => (
		<div
			data-testid={`mock-select-point-${isStarting ? 'starting' : 'ending'}`}
			onClick={() => setIsPointSelecting(!isPointSelecting)}
		>
			<button
				data-testid={`mock-select-button-${isStarting ? 'starting' : 'ending'}`}
				onClick={(e) => {
					e.stopPropagation();
					if (isStarting) {
						setPoint({
							lngLat: { lng: -105, lat: 40 } as LngLat,
							name: 'Selected Location'
						});
					} else {
						setPoint({
							lngLat: { lng: -106, lat: 41 } as LngLat,
							name: 'Selected Location'
						});
					}
				}}
			>
				Select Point
			</button>
		</div>
	)
}));

vi.mock('@/components/card-content/check-route/route-result', () => ({
	default: () => <div data-testid="mock-route-result">Route Result</div>
}));

vi.mock('lucide-react', () => ({
	ArrowDownUp: ({ onClick }: any) => (
		<div
			data-testid="mock-arrow-down-up"
			onClick={onClick}
		>
			Swap
		</div>
	)
}));

describe('CheckRoute Component', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders select points and route result components', () => {
		// Act
		render(<CheckRoute />);

		// Assert
		expect(screen.getByTestId('mock-select-point-starting')).toBeInTheDocument();
		expect(screen.getByTestId('mock-select-point-ending')).toBeInTheDocument();
		expect(screen.getByTestId('mock-route-result')).toBeInTheDocument();
		expect(screen.queryByTestId('mock-arrow-down-up')).not.toBeInTheDocument();
	});

	it('shows reverse button when points are available', () => {
		// Arrange
		vi.mocked(useCheckRoutes).mockReturnValueOnce({
			route: null,
			animatedRoute: null,
			startingPoint: mockStartingPoint,
			endingPoint: mockEndingPoint,
			isBothSelected: true,
			isSelectingPoint: false,
			isStartingPointSelecting: false,
			isEndingPointSelecting: false,
			setRoute: mockSetRoute,
			animateRoute: vi.fn(),
			setAnimatedRoute: mockSetAnimatedRoute,
			setStartingPoint: mockSetStartingPoint,
			setEndingPoint: mockSetEndingPoint,
			setIsStartingPointSelecting: mockSetIsStartingPointSelecting,
			setIsEndingPointSelecting: mockSetIsEndingPointSelecting,
			clearAllRouteStates: mockClearAllRouteStates,
			reversePoints: mockReversePoints,
			handleAddressName: mockHandleAddressName,
			handleFitBoundsForRoute: mockHandleFitBoundsForRoute
		});

		// Act
		render(<CheckRoute />);

		// Assert
		expect(screen.getByTestId('mock-arrow-down-up')).toBeInTheDocument();
	});

	it('calls reversePoints when swap button is clicked', () => {
		// Arrange
		vi.mocked(useCheckRoutes).mockReturnValueOnce({
			route: null,
			animatedRoute: null,
			startingPoint: mockStartingPoint,
			endingPoint: mockEndingPoint,
			isBothSelected: true,
			isSelectingPoint: false,
			isStartingPointSelecting: false,
			isEndingPointSelecting: false,
			setRoute: mockSetRoute,
			animateRoute: vi.fn(),
			setAnimatedRoute: mockSetAnimatedRoute,
			setStartingPoint: mockSetStartingPoint,
			setEndingPoint: mockSetEndingPoint,
			setIsStartingPointSelecting: mockSetIsStartingPointSelecting,
			setIsEndingPointSelecting: mockSetIsEndingPointSelecting,
			clearAllRouteStates: mockClearAllRouteStates,
			reversePoints: mockReversePoints,
			handleAddressName: mockHandleAddressName,
			handleFitBoundsForRoute: mockHandleFitBoundsForRoute
		});

		// Act
		render(<CheckRoute />);
		fireEvent.click(screen.getByTestId('mock-arrow-down-up'));

		// Assert
		expect(mockReversePoints).toHaveBeenCalledTimes(1);
	});

	it('interacts with starting point selection correctly', () => {
		// Act
		render(<CheckRoute />);

		// Trigger point selection UI
		fireEvent.click(screen.getByTestId('mock-select-point-starting'));

		// Assert
		expect(mockSetIsStartingPointSelecting).toHaveBeenCalledWith(true);

		// Set a starting point
		fireEvent.click(screen.getByTestId('mock-select-button-starting'));

		// Assert
		expect(mockSetStartingPoint).toHaveBeenCalledWith({
			lngLat: { lng: -105, lat: 40 },
			name: 'Selected Location'
		});
	});

	it('interacts with ending point selection correctly', () => {
		// Act
		render(<CheckRoute />);

		// Trigger point selection UI
		fireEvent.click(screen.getByTestId('mock-select-point-ending'));

		// Assert
		expect(mockSetIsEndingPointSelecting).toHaveBeenCalledWith(true);

		// Set an ending point
		fireEvent.click(screen.getByTestId('mock-select-button-ending'));

		// Assert
		expect(mockSetEndingPoint).toHaveBeenCalledWith({
			lngLat: { lng: -106, lat: 41 },
			name: 'Selected Location'
		});
	});
});