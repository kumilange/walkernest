import { useAtomCity } from "@/stores";
import type { FavoriteItem } from "@/types";
import { removeFromLocalStorageList } from "@/utils/localstorage";
import { useCallback, useState } from "react";
import { type LngLat, useMap } from "react-map-gl/maplibre";
import { useAtomFavItems } from "../../../stores/favoritesAtoms";

export default function useEventHandlers() {
  const { map } = useMap();
  const { city, setCity } = useAtomCity();
  const { favItems, setFavItems } = useAtomFavItems();
  const [selectedId, setSelectedId] = useState(0);

  const flyTo = useCallback(
    (lngLat: LngLat) => {
      if (map) {
        map.flyTo({ center: [lngLat.lng, lngLat.lat], zoom: 18 });
      }
    },
    [map]
  );

  const handleDelete = useCallback(
    ({
      e,
      id,
    }: {
      e: React.MouseEvent<SVGSVGElement, MouseEvent>;
      id: number;
    }) => {
      e.preventDefault();
      e.stopPropagation(); // Prevent the parent button from being clicked
      removeFromLocalStorageList<FavoriteItem>("favorites", id);
      setFavItems(favItems.filter((fav) => fav.id !== id));
    },
    [favItems, setFavItems]
  );

  const handleSelect = useCallback(
    ({
      e,
      id,
      lngLat,
    }: {
      e: React.MouseEvent<HTMLButtonElement, MouseEvent>;
      id: number;
      lngLat: LngLat;
    }) => {
      e.preventDefault();
      setSelectedId(id);
      flyTo(lngLat);

      const favItem = favItems.find((fav) => fav.id === id);
      if (favItem?.city && city !== favItem.city) {
        setCity(favItem.city);
      }
    },
    [favItems, flyTo, city, setCity]
  );

  // Touch event handlers for mobile support
  const handleSelectTouch = useCallback(
    (e: React.TouchEvent<HTMLButtonElement>, id: number, lngLat: LngLat) => {
      e.preventDefault();
      setSelectedId(id);
      flyTo(lngLat);

      const favItem = favItems.find((fav) => fav.id === id);
      if (favItem?.city && city !== favItem.city) {
        setCity(favItem.city);
      }
    },
    [favItems, flyTo, city, setCity]
  );

  const handleDeleteTouch = useCallback(
    (e: React.TouchEvent<SVGSVGElement>, id: number) => {
      e.preventDefault();
      e.stopPropagation(); // Prevent the parent button from being clicked
      removeFromLocalStorageList<FavoriteItem>("favorites", id);
      setFavItems(favItems.filter((fav) => fav.id !== id));
    },
    [favItems, setFavItems]
  );

  return {
    selectedId,
    handleDelete,
    handleSelect,
    handleSelectTouch,
    handleDeleteTouch,
  };
}
