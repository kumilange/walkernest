import { useCallback } from 'react';
import { MapLayerMouseEvent, useMap } from 'react-map-gl/maplibre';
import { useAtomLastLayerId } from '@/atoms';
import { useCheckRoutes } from '@/hooks';
import useFeaturePopup from './use-feature-popup';

export default function useEventHandlers() {
	const { map } = useMap();
	const { setLastLayerId } = useAtomLastLayerId();
	const { lngLat,
		properties,
		isPopupOpen,
		isFavPopupOpen,
		setLngLat,
		setIsPopupOpen,
		setProperties,
		handlePopupClose } = useFeaturePopup();
	const { isSelectingPoint,
		isStartingPointSelecting,
		isEndingPointSelecting,
		handleAddressName } = useCheckRoutes();

	const handleClick = useCallback(async (e: MapLayerMouseEvent) => {
		const { features, lngLat } = e;
		// For FeaturePopup
		if (!isSelectingPoint) {
			setLngLat(lngLat);
			setIsPopupOpen(true);
			setProperties(features ? features[0]?.properties : null);
			return;
		}
		// For CheckRoute
		await handleAddressName(lngLat);
	}, [isStartingPointSelecting, isEndingPointSelecting]);

	const handleMouseEnter = useCallback((e: MapLayerMouseEvent) => {
		e.target.getCanvas().style.cursor = 'pointer';
	}, []);

	const handleMouseLeave = useCallback((e: MapLayerMouseEvent) => {
		e.target.getCanvas().style.cursor = 'default';
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
