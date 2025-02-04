import { useAtom } from 'jotai';
import { cityAtom, maxDistanceAtom, isTmpAmenityOnAtom, isAmenityOnAtom } from './analysis-atoms';

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
