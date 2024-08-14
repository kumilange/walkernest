import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CityCombobox from '@/components/city-combobox';

// Mock event handler
const mockHandleSearch = vi.fn();
const mockSetCity = vi.fn();

// Create a variable to hold the mock city, so we can change it in tests
let mockCity: string | null = null;

// Mock city atom
vi.mock('@/atoms', () => {
	return {
		useAtomCity: vi.fn().mockImplementation(() => ({
			city: mockCity,
			setCity: mockSetCity
		}))
	};
});

// Mock constants
vi.mock('@/constants', () => {
	return {
		CITY_LIST_ARRAY: [
			{
				id: 1,
				value: 'denver',
				label: 'Denver',
				geometry: {
					type: 'Polygon',
					coordinates: [[[-105, 39], [-104, 39], [-104, 40], [-105, 40], [-105, 39]]]
				}
			},
			{
				id: 2,
				value: 'boulder',
				label: 'Boulder',
				geometry: {
					type: 'Polygon',
					coordinates: [[[-106, 40], [-105, 40], [-105, 41], [-106, 41], [-106, 40]]]
				}
			},
			{
				id: 3,
				value: 'austin',
				label: 'Austin',
				geometry: {
					type: 'Polygon',
					coordinates: [[[-98, 30], [-97, 30], [-97, 31], [-98, 31], [-98, 30]]]
				}
			}
		]
	};
});

// Mock event handlers
vi.mock('@/components/city-combobox/use-event-handlers', () => {
	return {
		default: () => ({
			handleSearch: mockHandleSearch
		})
	};
});

// Mock UI components
vi.mock('@/components/ui/button', () => {
	return {
		Button: ({ children, ...props }: any) => (
			<button data-testid="mock-button" {...props}>
				{children}
			</button>
		)
	};
});

vi.mock('@/components/ui/popover', () => {
	return {
		Popover: ({ children, open, onOpenChange }: any) => (
			<div data-testid="mock-popover">
				{children}
				<button
					data-testid="mock-toggle-popover"
					onClick={() => onOpenChange(!open)}
				>
					Toggle
				</button>
			</div>
		),
		PopoverTrigger: ({ children }: any) => (
			<div data-testid="mock-popover-trigger">{children}</div>
		),
		PopoverContent: ({ children }: any) => (
			<div data-testid="mock-popover-content">{children}</div>
		)
	};
});

vi.mock('@/components/ui/command', () => {
	return {
		Command: ({ children }: any) => <div data-testid="mock-command">{children}</div>,
		CommandInput: ({ placeholder }: any) => (
			<input data-testid="mock-command-input" placeholder={placeholder} />
		),
		CommandList: ({ children }: any) => (
			<div data-testid="mock-command-list">{children}</div>
		),
		CommandEmpty: ({ children }: any) => (
			<div data-testid="mock-command-empty">{children}</div>
		),
		CommandGroup: ({ children }: any) => (
			<div data-testid="mock-command-group">{children}</div>
		),
		CommandItem: ({ children, value, onSelect }: any) => (
			<div
				data-testid={`mock-command-item-${value}`}
				onClick={() => onSelect(value)}
			>
				{children}
			</div>
		)
	};
});

vi.mock('@/lib/misc', () => {
	return {
		cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
	};
});

vi.mock('lucide-react', () => {
	return {
		Check: ({ className }: any) => <div data-testid="mock-check" className={className}>✓</div>,
		ChevronsUpDown: ({ className }: any) => <div data-testid="mock-chevrons" className={className}>⇅</div>
	};
});

describe('CityCombobox Component', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCity = null; // Reset the city state before each test
	});

	it('renders with default state and placeholder text', () => {
		// Act
		render(<CityCombobox />);

		// Assert
		expect(screen.getByText('Select city...')).toBeInTheDocument();
		expect(screen.getByTestId('mock-chevrons')).toBeInTheDocument();
	});

	it('displays the selected city when one is selected', () => {
		// Arrange
		mockCity = 'denver';

		// Act
		render(<CityCombobox />);

		// Assert
		const button = screen.getByTestId('mock-button');
		expect(button).toHaveTextContent('Denver');
	});

	it('calls handleSearch when selecting a new city', () => {
		// Arrange
		mockCity = null;

		// Act
		render(<CityCombobox />);

		// Simulate opening the popover
		fireEvent.click(screen.getByTestId('mock-toggle-popover'));

		// Select a city
		fireEvent.click(screen.getByTestId('mock-command-item-denver'));

		// Assert
		expect(mockHandleSearch).toHaveBeenCalledWith(
			expect.objectContaining({
				value: 'denver',
				label: 'Denver',
				id: 1,
				geometry: expect.any(Object)
			})
		);
	});

	it('does not call handleSearch when selecting the same city', () => {
		// Arrange
		mockCity = 'denver';

		// Act
		render(<CityCombobox />);

		// Simulate opening the popover
		fireEvent.click(screen.getByTestId('mock-toggle-popover'));

		// Select the same city
		fireEvent.click(screen.getByTestId('mock-command-item-denver'));

		// Assert
		expect(mockHandleSearch).not.toHaveBeenCalled();
	});

	it('sorts the city list to place selected city at the top', () => {
		// Arrange
		mockCity = 'boulder';

		// Act
		render(<CityCombobox />);

		// Get all CommandItem elements
		const commandItems = screen.getAllByTestId(/mock-command-item/);

		// Assert
		// The first item should be the selected city (Boulder)
		expect(commandItems[0]).toHaveAttribute('data-testid', 'mock-command-item-boulder');
	});
}); 