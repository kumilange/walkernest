import type { FavoriteItem } from "@/types";
import { capitalize, cn } from "@/utils/misc";
import { Trash2 } from "lucide-react";
import { LngLat } from "maplibre-gl";
import { useAtomFavItems } from "../../../stores/favoritesAtoms";
import useEventHandlers from "./use-event-handlers";

export default function FavoritesList() {
  const { favItems } = useAtomFavItems();
  const { selectedId, handleSelect, handleDelete, handleSelectTouch, handleDeleteTouch } =
    useEventHandlers();

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
                  "border-gray-200 border-t p-2 transition-all duration-300 ease-in-out hover:bg-primary-lightGray",
                  { "bg-primary-lightGray": selectedId === id }
                )}
              >
                <button
                  type="button"
                  className="grid w-full grid-cols-[6fr_4fr_1fr] items-center"
                  onClick={(e) => handleSelect({ e, id, lngLat })}
                  onTouchEnd={(e) => handleSelectTouch(e, id, lngLat)}
                >
                  <span className="flex-grow pr-1 pl-1 text-left text-sm leading-tight">
                    {name}
                  </span>
                  <span className="break-all border-l pr-1 pl-1 text-sm leading-none">
                    {capitalize(city)}
                  </span>
                  <span className="border-l pl-1">
                    <Trash2
                      className="cursor-pointer transition-all duration-200 ease-in-out hover:text-red-500"
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
