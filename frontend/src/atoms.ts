import { atom } from 'jotai';
import type { FavoriteItem, LayersVisibility, RoutePoint } from '@/types';

export const cityAtom = atom<string | null>(null);
export const isFavPopupOpenAtom = atom(false);
export const favItemsAtom = atom<FavoriteItem[]>([]);
export const lastLayerIdAtom = atom<string>('');

export const isStartingPointSelectingAtom = atom(false);
export const isEndingPointSelectingAtom = atom(false);
export const startingPointAtom = atom<RoutePoint | null>(null);
export const endingPointAtom = atom<RoutePoint | null>(null);

export const walkingDistanceAtom = atom<any>({
	park: 320,
	supermarket: 800,
});

export const layersVisibilityAtom = atom<LayersVisibility>({
	result: true,
	cluster: true,
	park: true,
	supermarket: true,
	boundary: true,
});

export const hiddenLayersAtom = atom((get) => {
	const layersVisibility = get(layersVisibilityAtom);
	const hiddenLayers = Object.entries(layersVisibility)
		.filter(([_, value]) => !value)
		.map(([key, _]) => key);
	return hiddenLayers;
});
