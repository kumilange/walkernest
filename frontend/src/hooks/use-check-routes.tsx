import { useCallback, useState } from 'react';
import { useAtomRoute } from '@/atoms';
import { bbox } from '@turf/turf';
import { LngLat, LngLatBoundsLike } from 'react-map-gl/maplibre';
import { setCursorStyle } from '@/lib/misc';
import { fetchAddressName } from '@/lib/fetcher';
import { toast, useCityMap } from '@/hooks';
import { Route } from '@/types';

export default function useCheckRoutes() {
	const [animatedRoute, setAnimatedRoute] = useState<GeoJSON.LineString | null>(null);
	const { map, fitBounds } = useCityMap();
	const { route, setRoute, startingPoint, setStartingPoint, endingPoint, setEndingPoint, isStartingPointSelecting, setIsStartingPointSelecting, isEndingPointSelecting, setIsEndingPointSelecting } = useAtomRoute();
	const isSelectingPoint = isStartingPointSelecting || isEndingPointSelecting;
	const isBothSelected = !!(startingPoint?.lngLat && endingPoint?.lngLat);

	const handleAddressName = async (lngLat: LngLat) => {
		try {
			const response = await fetchAddressName(lngLat);
			const displayName = response;
			const name = displayName || "N/A";

			if (isStartingPointSelecting) {
				setStartingPoint({
					lngLat,
					name,
				});
				setIsStartingPointSelecting(false)
			} else if (isEndingPointSelecting) {
				setEndingPoint({
					lngLat,
					name,
				});
				setIsEndingPointSelecting(false)
			}
		} catch (error) {
			toast({
				variant: 'destructive',
				title: 'Address name fetch failed.',
				description: 'There was a problem with getting address name.',
				duration: 10000,
			});
		}

		setCursorStyle({ isSelecting: false })
	}

	const handleFitBoundsForRoute = useCallback((data: Route) => {
		if (!map) return;

		const boundingBox = bbox(data.geometry);
		const lngLatBounds: LngLatBoundsLike = [
			[boundingBox[0], boundingBox[1]],
			[boundingBox[2], boundingBox[3]],
		];

		// if route geometry is outside of the screen, run fitBounds
		if (!map.getBounds().contains(lngLatBounds[0]) || !map.getBounds().contains(lngLatBounds[1])) {
			fitBounds({
				bounds: lngLatBounds,
				padding: {
					top: 100,
					right: 100,
					bottom: 100,
					left: 100,
				}
			});
		}
	}, [map, fitBounds])

	const clearAllRouteStates = useCallback(() => {
		setRoute(null);
		setAnimatedRoute(null);
		setStartingPoint(null);
		setEndingPoint(null);
		setIsStartingPointSelecting(false);
		setIsEndingPointSelecting(false);
		setCursorStyle({ isSelecting: false })
	}, [])

	const reversePoints = useCallback(() => {
		const swap = startingPoint;
		setStartingPoint(endingPoint);
		setEndingPoint(swap);
	}, [startingPoint, endingPoint])

	const animateRoute = (geometry: GeoJSON.LineString, duration: number) => {
		const coordinates = geometry.coordinates;
		const totalCoordinates = coordinates.length;
		let startTime: number | null = null;

		const animate = (timestamp: number) => {
			if (!startTime) startTime = timestamp;
			const elapsed = timestamp - startTime;

			// Calculate progress based on elapsed time
			const progress = Math.min(elapsed / duration, 1);
			const segmentCount = Math.floor(progress * totalCoordinates);

			setAnimatedRoute({
				type: 'LineString',
				coordinates: coordinates.slice(0, segmentCount),
			});

			// Continue animation if not yet complete
			if (progress < 1) {
				requestAnimationFrame(animate);
			}
		};

		requestAnimationFrame(animate);
	};

	return {
		route,
		animatedRoute,
		startingPoint,
		endingPoint,
		isBothSelected,
		isSelectingPoint,
		isStartingPointSelecting,
		isEndingPointSelecting,
		setRoute,
		animateRoute,
		setAnimatedRoute,
		setStartingPoint,
		setEndingPoint,
		setIsStartingPointSelecting,
		setIsEndingPointSelecting,
		clearAllRouteStates,
		reversePoints,
		handleAddressName,
		handleFitBoundsForRoute,
	}
}
