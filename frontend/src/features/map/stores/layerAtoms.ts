import type { LayersVisibility } from "@/types";
import { atom, useAtom } from "jotai";
import { isLayerHidden } from "../layers/helper"; // Corrected path for after move

export const lastLayerIdAtom = atom<string>("");

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
