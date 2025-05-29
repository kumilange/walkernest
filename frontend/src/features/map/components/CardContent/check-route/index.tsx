import { Button } from "@/components/ui/button";
import { useCheckRoutes } from "@/features/map/hooks";
import { ArrowDownUp } from "lucide-react";
import { useState } from "react";
import RouteResult from "./route-result";
import SelectPoint from "./select-point";

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
            <ArrowDownUp className="w-[16px] cursor-pointer" onClick={reversePoints} />
          </div>
        )}
      </div>
      <RouteResult />
    </>
  );
}
