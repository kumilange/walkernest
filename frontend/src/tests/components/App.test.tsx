import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '@/app';

// Mocks
vi.mock('@/components/ui/toaster', () => ({
	Toaster: () => <div data-testid="mock-toaster"></div>,
}));

vi.mock('@/components/error/error-boundary', () => ({
	default: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="mock-error-boundary">{children}</div>
	),
}));

vi.mock('@/components/city-map', () => ({
	default: () => <div data-testid="mock-city-map"></div>,
}));

describe('App Component', () => {
	it('renders without crashing', () => {
		// Act
		render(<App />);

		// Assert
		expect(screen.getByTestId('mock-error-boundary')).toBeInTheDocument();
		expect(screen.getByTestId('mock-toaster')).toBeInTheDocument();
		expect(screen.getByTestId('mock-city-map')).toBeInTheDocument();
	});
}); 