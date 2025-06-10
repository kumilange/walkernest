import { useCheckRoutes } from "@/features/map/hooks";
import { Car } from "lucide-react";
import { formatDistance, formatDurationInMins } from "./helper";

export default function RouteResult() {
  const { route, isBothSelected } = useCheckRoutes();

  return (
    <>
      {isBothSelected && route && (
        <div className="relative mt-6 flex h-[28px] w-full items-baseline gap-2">
          <Car className="absolute top-0 h-[26px] w-[26px]" />
          <div className="ml-9">
            <span className="font-bold text-green-600 text-xl">
              {formatDurationInMins(route.duration)}
            </span>
            <span className="ml-1">mins</span>
          </div>
          <div className="ml-auto">
            <span className="font-bold">{formatDistance(route.distance).mi}</span>
            <span className="ml-1">mi</span>
            <span className="ml-1">/</span>
            <span className="ml-1 font-bold">{formatDistance(route.distance).km}</span>
            <span className="ml-1">km</span>
          </div>
        </div>
      )}
    </>
  );
}
