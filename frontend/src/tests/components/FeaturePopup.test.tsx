import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FeaturePopup from '@/components/popup/feature-popup';
import { LngLat } from 'react-map-gl/maplibre';

// Mock handlers and state
const mockHandlePopupClose = vi.fn();
const mockFavItems = [
	{
		id: 'test-id-123',
		name: 'Favorite Coffee Shop',
		city: 'Denver',
		feature: {
			type: 'Feature',
			geometry: {
				type: 'Point',
				coordinates: [-105.0, 39.0]
			},
			properties: {
				id: 'test-id-123',
				name: 'Coffee Shop'
			}
		}
	}
];

// Mock data
const mockLngLat = { lng: -105.0, lat: 39.0 } as LngLat;
const mockProperties = {
	id: 'test-id-123',
	name: 'Test Location',
	type: 'restaurant',
	address: '123 Main St'
};

// Mock atoms
vi.mock('@/atoms', () => ({
	useAtomFavItems: vi.fn().mockImplementation(() => ({
		favItems: mockFavItems
	}))
}));

// Mock helper functions
vi.mock('@/components/popup/feature-popup/helper', () => ({
	handleFavorites: vi.fn().mockImplementation(() => ({
		FavComponent: <span data-testid="mock-fav-component">★</span>,
		favItemName: 'Favorite Coffee Shop'
	})),
	processProperties: vi.fn().mockImplementation(() => [
		['text-green-800', 'restaurant'],
		['address', '123 Main St'],
		['name', 'Test Location']
	])
}));

// Mock constants
vi.mock('@/components/layer/constants', () => ({
	VALID_PROPERTY_PAIRS: {
		'text-green-800': {
			icon: <span data-testid="mock-restaurant-icon">🍽️</span>
		},
		address: {
			icon: <span data-testid="mock-address-icon">📍</span>
		}
	}
}));

// Mock UI components
vi.mock('react-map-gl/maplibre', () => ({
	Popup: ({ children, onClose, className }: any) => (
		<div data-testid="mock-popup" className={className}>
			{children}
			<button data-testid="popup-close" onClick={onClose}>Close Popup</button>
		</div>
	)
}));

vi.mock('@/components/button', () => ({
	CloseButton: ({ handleClose }: any) => (
		<button data-testid="close-button" onClick={handleClose}>X</button>
	)
}));

// Mock misc
vi.mock('@/lib/misc', () => ({
	capitalize: (str: string) => str.charAt(0).toUpperCase() + str.slice(1)
}));

describe('FeaturePopup Component', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders the popup with processed properties', () => {
		// Arrange
		const props = {
			lngLat: mockLngLat,
			properties: mockProperties,
			handlePopupClose: mockHandlePopupClose
		};

		// Act
		render(<FeaturePopup {...props} />);

		// Assert
		expect(screen.getByTestId('mock-popup')).toBeInTheDocument();
		expect(screen.getByTestId('mock-restaurant-icon')).toBeInTheDocument();
		expect(screen.getByTestId('mock-address-icon')).toBeInTheDocument();
		expect(screen.getByText('Restaurant')).toBeInTheDocument();
		expect(screen.getByText('123 Main St')).toBeInTheDocument();
	});

	it('displays favorite status when item is in favorites', () => {
		// Arrange
		const props = {
			lngLat: mockLngLat,
			properties: mockProperties,
			handlePopupClose: mockHandlePopupClose
		};

		// Act
		render(<FeaturePopup {...props} />);

		// Assert
		expect(screen.getByTestId('mock-fav-component')).toBeInTheDocument();
		expect(screen.getByText('Favorite Coffee Shop')).toBeInTheDocument();
	});

	it('calls handlePopupClose when close button is clicked', () => {
		// Arrange
		const props = {
			lngLat: mockLngLat,
			properties: mockProperties,
			handlePopupClose: mockHandlePopupClose
		};

		// Act
		render(<FeaturePopup {...props} />);
		fireEvent.click(screen.getByTestId('close-button'));

		// Assert
		expect(mockHandlePopupClose).toHaveBeenCalledTimes(1);
	});

	it('calls handlePopupClose when the popup is closed directly', () => {
		// Arrange
		const props = {
			lngLat: mockLngLat,
			properties: mockProperties,
			handlePopupClose: mockHandlePopupClose
		};

		// Act
		render(<FeaturePopup {...props} />);
		fireEvent.click(screen.getByTestId('popup-close'));

		// Assert
		expect(mockHandlePopupClose).toHaveBeenCalledTimes(1);
	});

	it('uses the first property value for styling', () => {
		// Arrange
		const props = {
			lngLat: mockLngLat,
			properties: mockProperties,
			handlePopupClose: mockHandlePopupClose
		};

		// Act
		render(<FeaturePopup {...props} />);

		// Assert
		expect(screen.getByTestId('mock-restaurant-icon')).toBeInTheDocument();
	});
}); 