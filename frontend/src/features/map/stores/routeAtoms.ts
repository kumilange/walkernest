import { atom, useAtom } from "jotai";
import type { Route, RoutePoint } from "@/types";

export const routeAtom = atom<Route | null>(null);
export const isStartingPointSelectingAtom = atom(false);
export const isEndingPointSelectingAtom = atom(false);
export const startingPointAtom = atom<RoutePoint | null>(null);
export const endingPointAtom = atom<RoutePoint | null>(null);

export function useAtomRoute() {
	const [route, setRoute] = useAtom(routeAtom);
	const [startingPoint, setStartingPoint] = useAtom(startingPointAtom);
	const [endingPoint, setEndingPoint] = useAtom(endingPointAtom);
	const [isStartingPointSelecting, setIsStartingPointSelecting] = useAtom(
		isStartingPointSelectingAtom,
	);
	const [isEndingPointSelecting, setIsEndingPointSelecting] = useAtom(
		isEndingPointSelectingAtom,
	);

	return {
		route,
		setRoute,
		startingPoint,
		setStartingPoint,
		endingPoint,
		setEndingPoint,
		isStartingPointSelecting,
		setIsStartingPointSelecting,
		isEndingPointSelecting,
		setIsEndingPointSelecting,
	};
} 