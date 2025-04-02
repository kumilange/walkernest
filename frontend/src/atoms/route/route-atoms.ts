import { atom } from "jotai";
import type { Route, RoutePoint } from "@/types";

export const routeAtom = atom<Route | null>(null);
export const isStartingPointSelectingAtom = atom(false);
export const isEndingPointSelectingAtom = atom(false);
export const startingPointAtom = atom<RoutePoint | null>(null);
export const endingPointAtom = atom<RoutePoint | null>(null);
