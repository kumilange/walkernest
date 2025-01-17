import { useCallback, useEffect, useMemo } from 'react';
import {
	Layer,
	LayerProps,
	Source,
	LngLatBoundsLike
} from 'react-map-gl/maplibre';
import { bbox } from '@turf/turf';
import { fetchRoute } from '@/lib/fetcher';
import { toast } from '@/hooks/use-toast';
import useCheckRoutes from '@/hooks/use-check-routes';
import { Route, RoutePoint } from '@/types';
import useCityMap from '@/hooks/use-city-map';

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

		const startingLngLat = (startingPoint as RoutePoint).lngLat;
		const endingLngLat = (endingPoint as RoutePoint).lngLat;
		const coords = `${startingLngLat.lng},${startingLngLat.lat};${endingLngLat.lng},${endingLngLat.lat}`;

		// Fetch the route from the OSRM API
		fetchRoute(coords).then((data) => {
			setRoute(data);
			handleFitBoundsForRoute(data)
		}).catch(() => {
			toast({
				variant: 'destructive',
				title: 'Get routes failed.',
				description: 'There was a problem with your request.',
				duration: 10000,
			});
		});
	}, [startingPoint, endingPoint, isBothSelected, handleFitBoundsForRoute]);



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
