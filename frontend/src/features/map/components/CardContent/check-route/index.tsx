import { Button } from "@/components/ui/button";
import { useCheckRoutes } from "@/features/map/hooks";
import { ArrowDownUp } from "lucide-react";
import RouteResult from "./route-result";
import SelectPoint from "./select-point";

export default function CheckRoute() {
  const {
    startingPoint,
    endingPoint,
    isStartingPointSelecting,
    isEndingPointSelecting,
    isRouteFetching,
    setStartingPoint,
    setEndingPoint,
    setIsStartingPointSelecting,
    setIsEndingPointSelecting,
    setRoute,
    reversePoints,
    handleReverseTouch,
    handleGeocodeAddress,
  } = useCheckRoutes();

  return (
    <div className="flex flex-col gap-4">
      <div className="center flex gap-1">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <SelectPoint
            isStarting={true}
            point={startingPoint}
            setPoint={setStartingPoint}
            isPointSelecting={isStartingPointSelecting}
            setIsPointSelecting={setIsStartingPointSelecting}
            onGeocodeAddress={handleGeocodeAddress}
            setRoute={setRoute}
            isRouteFetching={isRouteFetching}
          />
          <SelectPoint
            isStarting={false}
            point={endingPoint}
            setPoint={setEndingPoint}
            isPointSelecting={isEndingPointSelecting}
            setIsPointSelecting={setIsEndingPointSelecting}
            onGeocodeAddress={handleGeocodeAddress}
            setRoute={setRoute}
            isRouteFetching={isRouteFetching}
          />
        </div>
        {(startingPoint || endingPoint) && (
          <div className="flex flex-shrink-0 items-center">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={reversePoints}
              onTouchEnd={handleReverseTouch}
              disabled={isRouteFetching}
              title="Reverse starting and ending points"
              className="hover:bg-transparent hover:text-current"
            >
              <ArrowDownUp className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      <RouteResult />
    </div>
  );
}
