import { useAtomHiddenLayers } from '@/atoms';
import { isLayerHidden } from '@/components/layer/helper';

export default function useLayerVisibility(id: string) {
	const { hiddenLayers } = useAtomHiddenLayers()
	return isLayerHidden({ id, hiddenLayers });
}
