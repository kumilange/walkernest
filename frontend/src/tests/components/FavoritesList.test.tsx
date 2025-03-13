import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FavoritesList from '@/components/card-content/favorites-list';

// Setup mocks
const mockHandleSelect = vi.fn();
const mockHandleDelete = vi.fn();
const mockSetFavItems = vi.fn();

let mockFavItems = [
	{
		id: '1',
		name: 'Home',
		city: 'denver',
		feature: {
			geometry: {
				coordinates: [-105, 40]
			}
		}
	},
	{
		id: '2',
		name: 'Work',
		city: 'boulder',
		feature: {
			geometry: {
				coordinates: [-106, 41]
			}
		}
	}
];

// Establish mock functions
vi.mock('@/atoms', () => ({
	useAtomFavItems: () => ({
		favItems: mockFavItems,
		setFavItems: mockSetFavItems
	})
}));

vi.mock('@/components/card-content/favorites-list/use-event-handlers', () => ({
	__esModule: true,
	default: () => ({
		selectedId: '1',
		handleSelect: mockHandleSelect,
		handleDelete: mockHandleDelete
	})
}));

vi.mock('@/lib/misc', () => ({
	capitalize: (str: string) => str.charAt(0).toUpperCase() + str.slice(1),
	cn: (...classes: any[]) => {
		return classes
			.filter(Boolean)
			.map(c => {
				if (typeof c === 'object') {
					return Object.entries(c)
						.filter(([_, value]) => Boolean(value))
						.map(([key]) => key);
				}
				return c;
			})
			.flat()
			.join(' ');
	}
}));

vi.mock('lucide-react', () => ({
	Trash2: (props: any) => (
		<div data-testid="mock-trash-icon" className={props.className} onClick={props.onClick}>
			Delete
		</div>
	)
}));

vi.mock('maplibre-gl', () => ({
	LngLat: function (lng: number, lat: number) {
		return { lng, lat };
	}
}));

describe('FavoritesList Component', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockFavItems = [
			{
				id: '1',
				name: 'Home',
				city: 'denver',
				feature: {
					geometry: {
						coordinates: [-105, 40]
					}
				}
			},
			{
				id: '2',
				name: 'Work',
				city: 'boulder',
				feature: {
					geometry: {
						coordinates: [-106, 41]
					}
				}
			}
		];
	});

	it('renders empty message when no favorites are available', () => {
		// Arrange
		mockFavItems = [];

		// Act
		render(<FavoritesList />);

		// Assert
		expect(screen.getByText('No favorites are added yet.')).toBeInTheDocument();
	});

	it('renders list of favorites when available', () => {
		// Act
		render(<FavoritesList />);

		// Assert
		expect(screen.getByText('Home')).toBeInTheDocument();
		expect(screen.getByText('Work')).toBeInTheDocument();
		expect(screen.getByText('Denver')).toBeInTheDocument();
		expect(screen.getByText('Boulder')).toBeInTheDocument();
		expect(screen.getAllByTestId('mock-trash-icon')).toHaveLength(2);
	});

	it('calls handleSelect when favorite item is clicked', () => {
		// Act
		render(<FavoritesList />);
		fireEvent.click(screen.getByText('Home'));

		// Assert
		expect(mockHandleSelect).toHaveBeenCalledWith({
			e: expect.any(Object),
			id: '1',
			lngLat: expect.any(Object)
		});
	});

	it('calls handleDelete when trash icon is clicked', () => {
		// Act
		render(<FavoritesList />);
		fireEvent.click(screen.getAllByTestId('mock-trash-icon')[0]);

		// Assert
		expect(mockHandleDelete).toHaveBeenCalledWith({
			e: expect.any(Object),
			id: '1'
		});
	});

	it('applies selected style to currently selected item', () => {
		// Act
		render(<FavoritesList />);

		// Assert
		const items = screen.getAllByRole('listitem');
		expect(items[0]).not.toEqual(items[1]);
		expect(items.length).toBeGreaterThan(1);
	});
});