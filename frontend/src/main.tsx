import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { MapProvider } from 'react-map-gl/maplibre';
import { queryClient } from '@/lib/fetcher';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/header';
import CityMap from '@/components/city-map';
import ErrorBoundary from '@/components/error/error-boundary';
import '@/styles/reset.css';
import '@/styles/globals.css';
import '@/styles/index.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@/styles/maplibre-gl-extend.css';

function App() {
	return (
		<>
			<ErrorBoundary>
				<Toaster />
				<Header />
				<main className="w-screen h-screen overflow-hidden">
					<CityMap />
				</main>
			</ErrorBoundary>
		</>
	);
}

ReactDOM.createRoot(document.getElementById('map') as HTMLElement).render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<MapProvider>
				<App />
			</MapProvider>
		</QueryClientProvider>
	</React.StrictMode>,
);
