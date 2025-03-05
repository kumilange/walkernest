import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../app';

describe('App', () => {
	it('renders without crashing', async () => {
		render(<App />);

		await waitFor(() => {
			expect(screen.getByRole('banner')).toBeInTheDocument();
		});
	});
}); 
