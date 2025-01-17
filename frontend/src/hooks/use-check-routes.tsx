import { useAtom } from 'jotai';
import { endingPointAtom, isEndingPointSelectingAtom, isStartingPointSelectingAtom, routeAtom, startingPointAtom } from '@/atoms';
import { LngLat } from 'react-map-gl/maplibre';
import { setCursorStyle } from '@/lib/misc';
import { fetchAddressName } from '@/lib/fetcher';
import { toast } from '@/hooks/use-toast';

export default function useCheckRoutes() {
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

	const clearAllRouteStates = () => {
		setRoute(null);
		setStartingPoint(null);
		setEndingPoint(null);
		setIsStartingPointSelecting(false);
		setIsEndingPointSelecting(false);
		setCursorStyle({ isSelecting: false })
	}

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
		handleAddressName
	}
}
