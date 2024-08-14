import { useCallback, useState } from 'react';
import { useAtomIsFavPopupOpen } from '@/atoms';
import { LngLat } from 'react-map-gl/maplibre';

export default function useFeaturePopup() {
	const { isFavPopupOpen, setIsFavPopupOpen } = useAtomIsFavPopupOpen();
	const [isPopupOpen, setIsPopupOpen] = useState(false);
	const [lngLat, setLngLat] = useState<LngLat | null>(null);
	const [properties, setProperties] = useState<{
		[key: string]: string;
	} | null>();

	const handlePopupClose = useCallback(() => {
		setLngLat(null);
		setProperties(null);
		setIsPopupOpen(false);
		setIsFavPopupOpen(false);
	}, []);

	return {
		lngLat,
		properties,
		isPopupOpen,
		isFavPopupOpen,
		setLngLat,
		setIsPopupOpen,
		setProperties,
		handlePopupClose,
	};
}
