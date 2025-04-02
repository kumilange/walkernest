import { atom } from "jotai";
import type { FavoriteItem } from "@/types";

export const isFavPopupOpenAtom = atom(false);
export const favItemsAtom = atom<FavoriteItem[]>([]);
