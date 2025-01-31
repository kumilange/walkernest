import { useAtom } from 'jotai';
import { lastLayerIdAtom, layersVisibilityAtom, hiddenLayersAtom } from './layer-atoms';

export function useAtomLastLayerId() {
	const [lastLayerId, setLastLayerId] = useAtom(lastLayerIdAtom);
	return { lastLayerId, setLastLayerId };
}

export function useAtomLayersVisibility() {
	const [layersVisibility, setLayersVisibility] = useAtom(layersVisibilityAtom);
	return { layersVisibility, setLayersVisibility };
}

export function useAtomHiddenLayers() {
	const [hiddenLayers] = useAtom(hiddenLayersAtom);
	return { hiddenLayers };
}