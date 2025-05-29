import { useAtomIsFavPopupOpen } from "@/features/map/stores/favoritesAtoms";
import { useCallback, useState } from "react";
import type { LngLat } from "react-map-gl/maplibre";

export default function useFeaturePopup() {
  const { isFavPopupOpen, setIsFavPopupOpen } = useAtomIsFavPopupOpen();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [lngLat, setLngLat] = useState<LngLat | null>(null);
  const [properties, setProperties] = useState<Record<
    string,
    string | number | boolean | null
  > | null>(null);

  const handlePopupClose = useCallback(() => {
    setLngLat(null);
    setProperties(null);
    setIsPopupOpen(false);
    setIsFavPopupOpen(false);
  }, [setIsFavPopupOpen]);

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
