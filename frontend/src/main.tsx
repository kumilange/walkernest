import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { MapProvider } from 'react-map-gl/maplibre';
import { queryClient } from '@/lib/fetcher';
import App from './app';

ReactDOM.createRoot(document.getElementById('map') as HTMLElement).render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<MapProvider>
				<App />
			</MapProvider>
		</QueryClientProvider>
	</React.StrictMode>,
);
