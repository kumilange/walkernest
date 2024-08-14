import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '@/components/error/error-boundary';
import { useAtomCity } from '@/atoms';

// Mocks
vi.mock('@/atoms', () => ({
	useAtomCity: vi.fn(),
}));

vi.mock('@/components/error/error-fallback', () => ({
	default: ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
		<div data-testid="mock-error-fallback">
			<div data-testid="error-message">{error.message}</div>
			<button data-testid="reset-button" onClick={resetErrorBoundary}>Reset</button>
		</div>
	),
}));

const ErrorComponent = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
	if (shouldThrow) {
		throw new Error('Test error message');
	}
	return <div data-testid="normal-component">Normal Component</div>;
};

describe('ErrorBoundary Component', () => {
	beforeEach(() => {
		vi.spyOn(console, 'error').mockImplementation(() => { });
		(useAtomCity as any).mockReturnValue({
			setCity: vi.fn(),
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('renders children when no error occurs', () => {
		// Arrange
		const testChild = <div data-testid="test-child">Test Child</div>;

		// Act
		render(<ErrorBoundary>{testChild}</ErrorBoundary>);

		// Assert
		expect(screen.getByTestId('test-child')).toBeInTheDocument();
		expect(screen.queryByTestId('mock-error-fallback')).not.toBeInTheDocument();
	});

	it('renders error fallback when an error occurs', () => {
		// Act
		render(
			<ErrorBoundary>
				<ErrorComponent shouldThrow={true} />
			</ErrorBoundary>
		);

		// Assert
		expect(screen.getByTestId('mock-error-fallback')).toBeInTheDocument();
	});

	it('calls setCity(null) when Reset button is clicked', () => {
		// Arrange
		const setCityMock = vi.fn();
		(useAtomCity as any).mockReturnValue({
			setCity: setCityMock,
		});

		// Act
		render(
			<ErrorBoundary>
				<ErrorComponent shouldThrow={true} />
			</ErrorBoundary>
		);
		screen.getByTestId('reset-button').click();

		// Assert
		expect(setCityMock).toHaveBeenCalledWith(null);
	});
}); 