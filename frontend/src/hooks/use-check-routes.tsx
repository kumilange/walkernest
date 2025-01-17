import { useCallback } from 'react';
import { useAtom } from 'jotai';
import { endingPointAtom, isEndingPointSelectingAtom, isStartingPointSelectingAtom, routeAtom, startingPointAtom } from '@/atoms';
import { bbox } from '@turf/turf';
import { LngLat, LngLatBoundsLike } from 'react-map-gl/maplibre';
import { setCursorStyle } from '@/lib/misc';
import { fetchAddressName } from '@/lib/fetcher';
import { toast } from '@/hooks/use-toast';
import { Route } from '@/types';
import useCityMap from '@/hooks/use-city-map';

export default function useCheckRoutes() {
	const { map, fitBounds } = useCityMap();
	const [route, setRoute] = useAtom(routeAtom);
	const [startingPoint, setStartingPoint] = useAtom(startingPointAtom)
	const [endingPoint, setEndingPoint] = useAtom(endingPointAtom)
	const [isStartingPointSelecting, setIsStartingPointSelecting] = useAtom(isStartingPointSelectingAtom)
	const [isEndingPointSelecting, setIsEndingPointSelecting] = useAtom(isEndingPointSelectingAtom)
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
		if (map === undefined) return;

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

	return {
		route,
		startingPoint,
		endingPoint,
		isBothSelected,
		isSelectingPoint,
		isStartingPointSelecting,
		isEndingPointSelecting,
		setRoute,
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
