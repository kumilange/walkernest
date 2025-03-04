import Header from '@/components/header';
import CityMap from '@/components/city-map';
import { Toaster } from '@/components/ui/toaster';
import ErrorBoundary from '@/components/error/error-boundary';
import '@/styles/reset.css';
import '@/styles/globals.css';
import '@/styles/index.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@/styles/maplibre-gl-extend.css';

export default function App() {
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