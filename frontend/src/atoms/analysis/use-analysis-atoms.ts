import { atom, useAtom } from "jotai";
import type { MaxDistance, IsAmenityOn } from "@/types";

const cityAtom = atom<string | null>(null);

const maxDistanceAtom = atom<MaxDistance>({
  park: 320,
  supermarket: 800,
  cafe: 800,
});

const isTmpAmenityOnAtom = atom<IsAmenityOn>({
  park: true,
  supermarket: true,
  cafe: true,
});

const isAmenityOnAtom = atom<IsAmenityOn>({
  park: true,
  supermarket: true,
  cafe: true,
});

export function useAtomCity() {
  const [city, setCity] = useAtom(cityAtom);
  return { city, setCity };
}

export function useAtomMaxDistance() {
  const [maxDistance, setMaxDistance] = useAtom(maxDistanceAtom);
  return { maxDistance, setMaxDistance };
}

export function useAtomIsTmpAmenityOn() {
  const [isTmpAmenityOn, setIsTmpAmenityOn] = useAtom(isTmpAmenityOnAtom);
  return { isTmpAmenityOn, setIsTmpAmenityOn };
}

export function useAtomIsAmenityOn() {
  const [isAmenityOn, setIsAmenityOn] = useAtom(isAmenityOnAtom);
  return { isAmenityOn, setIsAmenityOn };
}
