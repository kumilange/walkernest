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
      <div className="flex center gap-1">
        <div className="flex-1 min-w-0 flex flex-col gap-3">
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
          <div className="flex items-center flex-shrink-0">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={reversePoints}
              onTouchEnd={handleReverseTouch}
              disabled={isRouteFetching}
              title="Reverse starting and ending points"
              className="w-4 h-4 hover:bg-transparent hover:text-current"
            >
              <ArrowDownUp className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
      <RouteResult />
    </div>
  );
}
