import type { FavoriteItem } from "@/types";
import { atom, useAtom } from "jotai";

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
