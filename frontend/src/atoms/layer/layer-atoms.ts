import { atom } from 'jotai';
import type { LayersVisibility } from '@/types';

export const lastLayerIdAtom = atom<string>('');

export const layersVisibilityAtom = atom<LayersVisibility>({
	result: true,
	cluster: true,
	park: true,
	supermarket: true,
	cafe: true,
	boundary: true,
});

export const hiddenLayersAtom = atom((get) => {
	const layersVisibility = get(layersVisibilityAtom);
	const hiddenLayers = Object.entries(layersVisibility)
		.filter(([_, value]) => !value)
		.map(([key, _]) => key);
	return hiddenLayers;
});
