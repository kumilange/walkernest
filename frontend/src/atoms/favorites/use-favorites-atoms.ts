import { useAtom, atom } from "jotai";
import type { FavoriteItem } from "@/types";

export const isFavPopupOpenAtom = atom(false);
export const favItemsAtom = atom<FavoriteItem[]>([]);

export function useAtomIsFavPopupOpen() {
  const [isFavPopupOpen, setIsFavPopupOpen] = useAtom(isFavPopupOpenAtom);
  return { isFavPopupOpen, setIsFavPopupOpen };
}

export function useAtomFavItems() {
  const [favItems, setFavItems] = useAtom(favItemsAtom);
  return { favItems, setFavItems };
}
