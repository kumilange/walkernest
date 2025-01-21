import { useCallback, useState } from 'react';
import { useAtom } from 'jotai';
import { isFavPopupOpenAtom } from '@/atoms';
import { LngLat } from 'react-map-gl/maplibre';

export default function useFeaturePopup() {
	const [isFavPopupOpen, setIsFavPopupOpen] = useAtom(isFavPopupOpenAtom);
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
