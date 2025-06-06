import type { FavoriteItem } from "@/types";
import { capitalize, cn } from "@/utils/misc";
import { Trash2 } from "lucide-react";
import { LngLat } from "maplibre-gl";
import { useCallback } from "react";
import { useAtomFavItems } from "../../../stores/favoritesAtoms";
import useEventHandlers from "./use-event-handlers";

export default function FavoritesList() {
  const { favItems } = useAtomFavItems();
  const { selectedId, handleSelect, handleDelete } = useEventHandlers();

  // Touch event handlers for mobile support
  const handleSelectTouch = useCallback(
    (e: React.TouchEvent<HTMLButtonElement>, id: number, lngLat: LngLat) => {
      e.preventDefault();
      const syntheticEvent = {
        preventDefault: () => {},
        stopPropagation: () => {},
      } as React.MouseEvent<HTMLButtonElement, MouseEvent>;
      handleSelect({ e: syntheticEvent, id, lngLat });
    },
    [handleSelect]
  );

  const handleDeleteTouch = useCallback(
    (e: React.TouchEvent<SVGSVGElement>, id: number) => {
      e.preventDefault();
      e.stopPropagation();
      const syntheticEvent = {
        preventDefault: () => {},
        stopPropagation: () => {},
      } as React.MouseEvent<SVGSVGElement, MouseEvent>;
      handleDelete({ e: syntheticEvent, id });
    },
    [handleDelete]
  );

  return (
    <>
      {favItems.length === 0 ? (
        <p>No favorites are added yet.</p>
      ) : (
        <ul className="grid w-full items-center">
          {favItems.map((fav: FavoriteItem) => {
            const { id, name, city, feature } = fav;
            const [longitude, latitude] = feature.geometry.coordinates;
            const lngLat = new LngLat(longitude, latitude);

            return (
              <li
                key={id}
                className={cn(
                  "p-2 border-t border-gray-200 transition-all duration-300 ease-in-out hover:bg-primary-lightGray",
                  { "bg-primary-lightGray": selectedId === id }
                )}
              >
                <button
                  type="button"
                  className="grid grid-cols-[6fr_4fr_1fr] items-center w-full"
                  onClick={(e) => handleSelect({ e, id, lngLat })}
                  onTouchEnd={(e) => handleSelectTouch(e, id, lngLat)}
                >
                  <span className="pl-1 pr-1 text-left text-sm flex-grow leading-tight">
                    {name}
                  </span>
                  <span className="pl-1 pr-1 border-l text-sm leading-none break-all">
                    {capitalize(city)}
                  </span>
                  <span className="border-l pl-1">
                    <Trash2
                      className="transition-all duration-200 ease-in-out hover:text-red-500 cursor-pointer"
                      onClick={(e) => handleDelete({ e, id })}
                      onTouchEnd={(e) => handleDeleteTouch(e, id)}
                    />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
