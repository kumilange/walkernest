import { hiddenLayersAtom } from '@/atoms';
import { useAtomValue } from 'jotai';
import { isLayerHidden } from '@/components/layer/helper';

export default function useLayerVisibility(id: string) {
	const hiddenLayers = useAtomValue(hiddenLayersAtom);
	return isLayerHidden({ id, hiddenLayers });
}
