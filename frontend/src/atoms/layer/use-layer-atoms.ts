import { useAtom } from 'jotai';
import { lastLayerIdAtom, layersVisibilityAtom, hiddenLayersAtom } from './layer-atoms';
import { isLayerHidden } from '@/components/layer/helper';

export function useAtomLastLayerId() {
	const [lastLayerId, setLastLayerId] = useAtom(lastLayerIdAtom);
	return { lastLayerId, setLastLayerId };
}

export function useAtomLayersVisibility() {
	const [layersVisibility, setLayersVisibility] = useAtom(layersVisibilityAtom);
	return { layersVisibility, setLayersVisibility };
}

export function useIsLayerHidden(type: string) {
	const [hiddenLayers] = useAtom(hiddenLayersAtom);
	return isLayerHidden({ type, hiddenLayers });
}
