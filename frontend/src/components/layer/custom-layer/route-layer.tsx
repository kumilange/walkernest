import { useEffect } from 'react';
import {
	Layer,
	LayerProps,
	Source,
} from 'react-map-gl/maplibre';
import { fetchRoute } from '@/lib/fetcher';
import { toast } from '@/hooks/use-toast';
import useCheckRoutes from '@/hooks/use-check-routes';
import { RoutePoint } from '@/types';

// TODO: Add animation to the route
const layerStyle: LayerProps = {
	id: 'route',
	type: 'line',
	source: 'route',
	layout: {
		'line-join': 'round',
		'line-cap': 'round',
	},
	paint: {
		'line-color': '#3887be',
		'line-width': 5,
	},
};

export default function RouteLayer() {
	const { route, setRoute, startingPoint, endingPoint, isBothSelected, handleFitBoundsForRoute } = useCheckRoutes();

	useEffect(() => {
		if (!isBothSelected) return;

		const handleRoute = async () => {
			try {
				const startingLngLat = (startingPoint as RoutePoint).lngLat;
				const endingLngLat = (endingPoint as RoutePoint).lngLat;
				const coords = `${startingLngLat.lng},${startingLngLat.lat};${endingLngLat.lng},${endingLngLat.lat}`;

				// Fetch the route from the OSRM API
				const data = await fetchRoute(coords);
				setRoute(data);
				handleFitBoundsForRoute(data);
			} catch (error) {
				toast({
					variant: 'destructive',
					title: 'Get routes failed.',
					description: 'There was a problem with your request.',
					duration: 10000,
				});
			}
		};

		handleRoute();
	}, [startingPoint, endingPoint, isBothSelected, handleFitBoundsForRoute]);

	// TODO: create a custom layer for the route
	return (
		<>
			{isBothSelected && route?.geometry && (
				<Source id={'route-source'} type="geojson" data={route.geometry}>
					<Layer id={'route-layer'} {...layerStyle} />
				</Source>
			)}
		</>
	);
}
