import { useEffect } from 'react';
import {
	Layer,
	LayerProps,
	Source,
} from 'react-map-gl/maplibre';
import { fetchRoute } from '@/lib/fetcher';
import { RoutePoint } from '@/types';
import { toast, useCheckRoutes } from '@/hooks';
import { twColors } from '../constants';

const layerStyle: LayerProps = {
	id: 'route',
	type: 'line',
	source: 'route-source',
	layout: {
		'line-join': 'round',
		'line-cap': 'round',
	},
	paint: {
		'line-color': twColors.route,
		'line-width': 5,
		'line-dasharray': [0, 1],
	},
};

export default function RouteLayer() {
	const { animatedRoute, startingPoint, endingPoint, isBothSelected, setRoute, setAnimatedRoute, animateRoute, handleFitBoundsForRoute } = useCheckRoutes();

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
				// Start animation
				animateRoute(data.geometry, 1000);
			} catch (error) {
				toast({
					variant: 'destructive',
					title: 'Get routes failed.',
					description: 'There was a problem with your request.',
					duration: 10000,
				});
			}
		};

		setAnimatedRoute(null);
		handleRoute();
	}, [startingPoint, endingPoint, isBothSelected]);

	return (
		<>
			{isBothSelected && animatedRoute && (
				<Source id={'route-source'} type="geojson" data={animatedRoute}>
					<Layer id={'route-layer'}
						{...layerStyle}
					/>
				</Source>
			)}
		</>
	);
}
