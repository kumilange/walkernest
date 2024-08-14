import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AnalyzeApartment from '@/components/card-content/analyze-apartment';

// Basic mocks
vi.mock('@/components/card-content/analyze-apartment/constants', () => ({
	METERS_TO_MINS_IN_WALK: {
		320: 5,
		800: 10,
	},
	MINS_TO_METERS_IN_WALK: {
		5: 320,
		10: 800,
	},
}));

// Simple mock implementations
const mockSetMaxDistance = vi.fn();
const mockSetIsAmenityOn = vi.fn();
const mockIsFetching = vi.fn().mockReturnValue(false);

vi.mock('@/lib/fetcher', () => ({
	useAnalysis: () => ({
		isFetching: mockIsFetching(),
	}),
}));

vi.mock('@/constants', () => ({
	CITY_LIST_DICT: {
		Denver: { id: 1 },
		Boulder: { id: 2 },
	},
}));

vi.mock('@/atoms', () => ({
	useAtomCity: () => ({
		city: 'Denver',
	}),
	useAtomMaxDistance: () => ({
		maxDistance: { park: 320, supermarket: 800, cafe: 800 },
		setMaxDistance: mockSetMaxDistance,
	}),
	useAtomIsAmenityOn: () => ({
		isAmenityOn: { park: true, supermarket: true, cafe: true },
		setIsAmenityOn: mockSetIsAmenityOn,
	}),
	useAtomIsTmpAmenityOn: () => ({
		isTmpAmenityOn: { park: true, supermarket: true, cafe: true },
	}),
}));

vi.mock('@/lib/misc', () => ({
	generateCityDataParams: () => ({
		parkDistance: 320,
		supermarketDistance: 800,
		cafeDistance: 800,
		parkFilter: true,
		supermarketFilter: true,
		cafeFilter: true,
	}),
}));

vi.mock('@/components/ui/form', () => ({
	Form: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-form">{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
	Button: ({ children, disabled, onClick, type, variant }: any) => (
		<button
			data-testid={`mock-button-${variant || 'default'}`}
			disabled={disabled}
			onClick={onClick}
			type={type}
		>
			{children}
		</button>
	),
}));

vi.mock('@/components/ui/popover', () => ({
	PopoverClose: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="mock-popover-close">{children}</div>
	),
}));

vi.mock('@/components/button', () => ({
	LoadingButton: () => <div data-testid="mock-loading-button">Loading...</div>,
}));

vi.mock('@/components/card-content/analyze-apartment/form-field-item', () => ({
	default: ({ name }: { name: string }) => (
		<div data-testid={`mock-form-field-${name}`}>Form Field {name}</div>
	),
}));

// Mock the react-hook-form module
vi.mock('react-hook-form', () => ({
	useForm: () => ({
		handleSubmit: (callback: any) => (e: any) => {
			e?.preventDefault?.();
			callback({
				park: 5,
				supermarket: 10,
				cafe: 10,
				parkCheckbox: true,
				supermarketCheckbox: true,
				cafeCheckbox: true,
			});
		},
		getValues: () => ({
			park: 5,
			supermarket: 10,
			cafe: 10,
			parkCheckbox: true,
			supermarketCheckbox: true,
			cafeCheckbox: true,
		}),
		formState: { isValid: true },
		control: {},
	}),
}));

describe('AnalyzeApartment Component', () => {
	const originalConsoleError = console.error;

	beforeEach(() => {
		console.error = vi.fn();
		mockIsFetching.mockReturnValue(false);
		vi.clearAllMocks();
	});

	afterEach(() => {
		console.error = originalConsoleError;
	});

	it('renders form fields correctly', () => {
		// Act
		render(<AnalyzeApartment />);

		// Assert
		expect(screen.getByTestId('mock-form')).toBeInTheDocument();
		expect(screen.getByTestId('mock-form-field-park')).toBeInTheDocument();
		expect(screen.getByTestId('mock-form-field-supermarket')).toBeInTheDocument();
		expect(screen.getByTestId('mock-form-field-cafe')).toBeInTheDocument();
		expect(screen.getByTestId('mock-button-outline')).toBeInTheDocument();
		expect(screen.getByTestId('mock-button-default')).toBeInTheDocument();
		expect(screen.getByText('Analyze')).toBeInTheDocument();
	});

	it('shows loading button when fetching data', () => {
		// Arrange
		mockIsFetching.mockReturnValueOnce(true);

		// Act
		render(<AnalyzeApartment />);

		// Assert
		expect(screen.getByTestId('mock-loading-button')).toBeInTheDocument();
		expect(screen.queryByText('Analyze')).not.toBeInTheDocument();
	});

	it('handles form submission correctly', () => {
		// Act
		render(<AnalyzeApartment />);

		// Find and click submit button
		const submitButton = screen.getByText('Analyze');
		fireEvent.click(submitButton);

		// Assert
		expect(mockSetMaxDistance).toHaveBeenCalledWith(
			expect.objectContaining({
				park: expect.any(Number),
				supermarket: expect.any(Number),
				cafe: expect.any(Number),
			})
		);
		expect(mockSetIsAmenityOn).toHaveBeenCalledWith(
			expect.objectContaining({
				park: expect.any(Boolean),
				supermarket: expect.any(Boolean),
				cafe: expect.any(Boolean),
			})
		);
	});
}); 