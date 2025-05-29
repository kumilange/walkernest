import type { IsAmenityOn, MaxDistance } from "@/types";
import { atom, useAtom } from "jotai";

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
