import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Header from '@/components/header';

// Mocks
vi.mock('@/components/heading', () => ({
	default: () => <div data-testid="mock-heading">Heading Component</div>,
}));

vi.mock('@/components/menu-bar', () => ({
	default: () => <div data-testid="mock-menu-bar">Menu Bar Component</div>,
}));

describe('Header Component', () => {
	it('renders correctly with all expected elements', () => {
		// Act
		render(<Header />);

		// Assert
		const headerElement = screen.getByRole('banner');
		expect(headerElement).toBeInTheDocument();
		expect(screen.getByTestId('mock-heading')).toBeInTheDocument();
		expect(screen.getByTestId('mock-menu-bar')).toBeInTheDocument();
	});
}); 