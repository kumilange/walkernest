import { useAtom } from "jotai";
import { isFavPopupOpenAtom, favItemsAtom } from "./favorites-atoms";

export function useAtomIsFavPopupOpen() {
  const [isFavPopupOpen, setIsFavPopupOpen] = useAtom(isFavPopupOpenAtom);
  return { isFavPopupOpen, setIsFavPopupOpen };
}

export function useAtomFavItems() {
  const [favItems, setFavItems] = useAtom(favItemsAtom);
  return { favItems, setFavItems };
}
