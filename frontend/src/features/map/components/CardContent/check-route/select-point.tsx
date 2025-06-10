import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Route, RoutePoint } from "@/types";
import { CircleX, Locate, LocateFixed, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import useEventHandlers from "./hooks/use-event-handlers";

export default function SelectPoint({
  isStarting,
  point,
  setPoint,
  isPointSelecting,
  setIsPointSelecting,
  onGeocodeAddress,
  setRoute,
  isRouteFetching = false,
}: {
  isStarting: boolean;
  point: RoutePoint | null;
  isPointSelecting: boolean;
  setPoint: (point: RoutePoint | null) => void;
  setIsPointSelecting: (isPointSelecting: boolean) => void;
  onGeocodeAddress: (address: string, isStarting: boolean) => Promise<void>;
  setRoute: (route: Route | null) => void;
  isRouteFetching?: boolean;
}) {
  const [addressInput, setAddressInput] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    handleMapClick,
    handleClearPoint,
    handleMapClickTouch,
    handleClearPointTouch,
    handleKeyDown,
    handleInputChange,
    handleFocus,
  } = useEventHandlers({
    isPointSelecting,
    setIsPointSelecting,
    setRoute,
    setPoint,
    setAddressInput,
    onGeocodeAddress,
    isStarting,
    inputRef,
    addressInput,
    point,
    setIsGeocoding,
  });

  const classes = `w-[16px] w-4 h-4 ${point ? "text-green-600" : ""}`;

  // Update input value when point changes
  useEffect(() => {
    if (point) {
      setAddressInput(point.name);
    } else {
      setAddressInput("");
    }
  }, [point]);

  return (
    <div className="flex w-full items-center gap-1">
      <div className="w-4 flex-shrink-0">
        {isStarting ? <Locate className={classes} /> : <LocateFixed className={classes} />}
      </div>

      <div className="min-w-0 flex-1">
        <Input
          ref={inputRef}
          placeholder={`Enter ${isStarting ? "starting" : "ending"} address`}
          value={addressInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          disabled={isGeocoding || isRouteFetching}
          className={`w-full focus:border-green-500 ${
            isPointSelecting ? "border-green-500 bg-green-50" : ""
          }`}
        />
      </div>

      <div className="flex flex-shrink-0 items-center gap-1">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={handleMapClick}
          onTouchEnd={handleMapClickTouch}
          disabled={isGeocoding || isRouteFetching}
          title="Click on map to select point"
          className="h-4 w-4 hover:bg-transparent hover:text-current"
        >
          <MapPin className={`h-4 w-4 ${isPointSelecting ? "text-green-600" : ""}`} />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={handleClearPoint}
          onTouchEnd={handleClearPointTouch}
          disabled={isGeocoding || isRouteFetching}
          title="Clear point"
          className="h-4 w-4 hover:bg-transparent hover:text-current"
        >
          <CircleX className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
