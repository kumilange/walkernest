import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Route, RoutePoint } from "@/types";
import { setCursorStyle } from "@/utils/misc";
import { CircleX, Locate, LocateFixed, MapPin } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

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

  const classes = `w-[16px] w-4 h-4 ${point ? "text-green-600" : ""}`;

  // Update input value when point changes
  useEffect(() => {
    if (point) {
      setAddressInput(point.name);
    } else {
      setAddressInput("");
    }
  }, [point]);

  const handleMapClick = useCallback(() => {
    if (!isPointSelecting) {
      setRoute(null);
      setPoint(null);
      setAddressInput("");
      setIsPointSelecting(true);
      setCursorStyle({ isSelecting: true });
      inputRef.current?.blur(); // Remove focus to prevent interference
    }
  }, [isPointSelecting, setIsPointSelecting, setRoute, setPoint]);

  const handleClearPoint = useCallback(() => {
    setIsPointSelecting(false);
    setPoint(null);
    setAddressInput("");
    setCursorStyle({ isSelecting: false });
    inputRef.current?.focus();
  }, [setIsPointSelecting, setPoint]);

  // Touch event handlers for mobile support
  const handleMapClickTouch = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      handleMapClick();
    },
    [handleMapClick]
  );

  const handleClearPointTouch = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      handleClearPoint();
    },
    [handleClearPoint]
  );

  const handleAddressSearch = useCallback(async () => {
    if (!addressInput.trim() || addressInput === point?.name) return;

    setIsGeocoding(true);
    try {
      await onGeocodeAddress(addressInput.trim(), isStarting);
    } finally {
      setIsGeocoding(false);
    }
  }, [addressInput, onGeocodeAddress, isStarting, point?.name]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleAddressSearch();
      }
    },
    [handleAddressSearch]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setAddressInput(e.target.value);
      // Clear point if user starts typing a different address
      if (point && e.target.value !== point.name) {
        setPoint(null);
      }
    },
    [point, setPoint]
  );

  const handleFocus = useCallback(() => {
    // Stop map clicking when focused on input
    if (isPointSelecting) {
      setIsPointSelecting(false);
      setCursorStyle({ isSelecting: false });
    }
  }, [isPointSelecting, setIsPointSelecting]);

  return (
    <div className="flex items-center w-full gap-1">
      <div className="w-4 flex-shrink-0">
        {isStarting ? <Locate className={classes} /> : <LocateFixed className={classes} />}
      </div>

      <div className="flex-1 min-w-0">
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

      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={handleMapClick}
          onTouchEnd={handleMapClickTouch}
          disabled={isGeocoding || isRouteFetching}
          title="Click on map to select point"
          className="w-4 h-4 hover:bg-transparent hover:text-current"
        >
          <MapPin className={`w-4 h-4 ${isPointSelecting ? "text-green-600" : ""}`} />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={handleClearPoint}
          onTouchEnd={handleClearPointTouch}
          disabled={isGeocoding || isRouteFetching}
          title="Clear point"
          className="w-4 h-4 hover:bg-transparent hover:text-current"
        >
          <CircleX className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
