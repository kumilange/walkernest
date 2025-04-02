import { useAtom } from "jotai";
import {
  routeAtom,
  isStartingPointSelectingAtom,
  isEndingPointSelectingAtom,
  startingPointAtom,
  endingPointAtom,
} from "./route-atoms";

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
