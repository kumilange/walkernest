import { useState } from "react";
import { ArrowDownUp } from "lucide-react";
import { useCheckRoutes } from "@/features/map/hooks";
import SelectPoint from "./select-point";
import RouteResult from "./route-result";
import { Button } from "@/components/ui/button";

export default function CheckRoute() {
  const {
    startingPoint,
    endingPoint,
    isStartingPointSelecting,
    isEndingPointSelecting,
    setStartingPoint,
    setEndingPoint,
    setIsStartingPointSelecting,
    setIsEndingPointSelecting,
    reversePoints,
  } = useCheckRoutes();

  return (
    <>
      <div className="flex flex-full flex-row">
        <div className="flex flex-full flex-col gap-3 flex-grow">
          <SelectPoint
            isStarting={true}
            point={startingPoint}
            setPoint={setStartingPoint}
            isPointSelecting={isStartingPointSelecting}
            setIsPointSelecting={setIsStartingPointSelecting}
          />
          <SelectPoint
            isStarting={false}
            point={endingPoint}
            setPoint={setEndingPoint}
            isPointSelecting={isEndingPointSelecting}
            setIsPointSelecting={setIsEndingPointSelecting}
          />
        </div>
        {(startingPoint || endingPoint) && (
          <div className="flex items-center">
            <ArrowDownUp
              className="w-[16px] cursor-pointer"
              onClick={reversePoints}
            />
          </div>
        )}
      </div>
      <RouteResult />
    </>
  );
}
