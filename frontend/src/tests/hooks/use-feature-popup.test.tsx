import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import useFeaturePopup from '@/components/city-map/hooks/use-feature-popup';
import { LngLat } from 'react-map-gl/maplibre';

// Create a type for the atoms module with the mocked functions
interface MockedAtoms {
	useAtomIsFavPopupOpen: () => {
		isFavPopupOpen: boolean;
		setIsFavPopupOpen: (value: boolean) => void;
	};
}

// Mock dependencies
vi.mock('@/atoms', () => {
	const mockSetIsFavPopupOpen = vi.fn();
	return {
		useAtomIsFavPopupOpen: () => ({
			isFavPopupOpen: false,
			setIsFavPopupOpen: mockSetIsFavPopupOpen
		})
	};
});

describe('useFeaturePopup hook', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('initializes with default values', () => {
		// Arrange & Act
		const { result } = renderHook(() => useFeaturePopup());

		// Assert
		expect(result.current.lngLat).toBeNull();
		expect(result.current.properties).toBeUndefined();
		expect(result.current.isPopupOpen).toBe(false);
		expect(result.current.isFavPopupOpen).toBe(false);
	});

	it('updates lngLat when setLngLat is called', async () => {
		// Arrange
		const { result } = renderHook(() => useFeaturePopup());
		const mockLngLat = { lng: -105, lat: 40 } as LngLat;

		// Act
		act(() => {
			result.current.setLngLat(mockLngLat);
		});

		// Assert - wait for state update
		await waitFor(() => {
			expect(result.current.lngLat).toEqual(mockLngLat);
		});
	});

	it('updates isPopupOpen when setIsPopupOpen is called', async () => {
		// Arrange
		const { result } = renderHook(() => useFeaturePopup());

		// Act
		act(() => {
			result.current.setIsPopupOpen(true);
		});

		// Assert - wait for state update
		await waitFor(() => {
			expect(result.current.isPopupOpen).toBe(true);
		});
	});

	it('updates properties when setProperties is called', async () => {
		// Arrange
		const { result } = renderHook(() => useFeaturePopup());
		const mockProperties = { id: '123', name: 'Test Location' };

		// Act
		act(() => {
			result.current.setProperties(mockProperties);
		});

		// Assert - wait for state update
		await waitFor(() => {
			expect(result.current.properties).toEqual(mockProperties);
		});
	});

	it('resets all state when handlePopupClose is called', async () => {
		// Arrange
		const { result } = renderHook(() => useFeaturePopup());
		const mockLngLat = { lng: -105, lat: 40 } as LngLat;
		const mockProperties = { id: '123', name: 'Test Location' };

		// Set initial state
		act(() => {
			result.current.setLngLat(mockLngLat);
			result.current.setIsPopupOpen(true);
			result.current.setProperties(mockProperties);
		});

		// Verify initial state is set
		await waitFor(() => {
			expect(result.current.lngLat).toEqual(mockLngLat);
			expect(result.current.isPopupOpen).toBe(true);
			expect(result.current.properties).toEqual(mockProperties);
		});

		// Act
		act(() => {
			result.current.handlePopupClose();
		});

		// Assert - wait for state update
		await waitFor(() => {
			expect(result.current.lngLat).toBeNull();
			expect(result.current.properties).toBeNull();
			expect(result.current.isPopupOpen).toBe(false);
		});

		// Get access to the mock directly from the atoms module as a typed module
		const atoms = await import('@/atoms') as unknown as MockedAtoms;
		const setIsFavPopupOpen = atoms.useAtomIsFavPopupOpen().setIsFavPopupOpen;

		expect(setIsFavPopupOpen).toHaveBeenCalledWith(false);
	});
}); 