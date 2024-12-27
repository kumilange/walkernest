import { isFavPopupOpenAtom, lastLayerIdAtom } from '@/atoms';
import { useAtom, useSetAtom } from 'jotai';
import { useCallback, useState } from 'react';
import { MapLayerMouseEvent, LngLat, useMap } from 'react-map-gl/maplibre';

export default function useEventHandlers() {
	const { map } = useMap();
	const setLastLayerId = useSetAtom(lastLayerIdAtom);
	const [isFavPopupOpen, setIsFavPopupOpen] = useAtom(isFavPopupOpenAtom);
	const [isPopupOpen, setIsPopupOpen] = useState(false);
	const [lngLat, setLngLat] = useState<LngLat | null>(null);
	const [properties, setProperties] = useState<{
		[key: string]: string;
	} | null>();

	const handleClick = useCallback((e: MapLayerMouseEvent) => {
		const { features, lngLat } = e;
		setLngLat(lngLat);
		setIsPopupOpen(true);
		setProperties(features ? features[0]?.properties : null);
	}, []);

	const handleMouseEnter = useCallback((e: MapLayerMouseEvent) => {
		e.target.getCanvas().style.cursor = 'pointer';
	}, []);

	const handleMouseLeave = useCallback((e: MapLayerMouseEvent) => {
		e.target.getCanvas().style.cursor = 'default';
	}, []);

	const handlePopupClose = useCallback(() => {
		setLngLat(null);
		setProperties(null);
		setIsPopupOpen(false);
		setIsFavPopupOpen(false);
	}, []);

	const handleIdle = useCallback(() => {
		const layers = map?.getStyle()?.layers;
		if (layers && layers?.length > 0) {
			setLastLayerId(layers[layers.length - 1].id);
		}
	}, [map]);

	return {
		lngLat,
		properties,
		isPopupOpen,
		isFavPopupOpen,
		handleIdle,
		handleClick,
		handleMouseEnter,
		handleMouseLeave,
		handlePopupClose,
	};
}
