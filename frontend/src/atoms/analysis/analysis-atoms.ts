import { atom } from 'jotai';
import type { MaxDistance, IsAmenityOn } from '@/types';

export const cityAtom = atom<string | null>(null);

export const maxDistanceAtom = atom<MaxDistance>({
	park: 320,
	supermarket: 800,
	cafe: 800,
});

export const isTmpAmenityOnAtom = atom<IsAmenityOn>({
	park: true,
	supermarket: true,
	cafe: true,
});

export const isAmenityOnAtom = atom<IsAmenityOn>({
	park: true,
	supermarket: true,
	cafe: true,
});
