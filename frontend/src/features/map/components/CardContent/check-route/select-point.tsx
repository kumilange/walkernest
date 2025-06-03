import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RoutePoint } from "@/types";
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
  isRouteFetching = false,
}: {
  isStarting: boolean;
  point: RoutePoint | null;
  isPointSelecting: boolean;
  setPoint: (point: RoutePoint | null) => void;
  setIsPointSelecting: (isPointSelecting: boolean) => void;
  onGeocodeAddress: (address: string, isStarting: boolean) => Promise<void>;
  isRouteFetching?: boolean;
}) {
  const [addressInput, setAddressInput] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const classes = `w-[16px] ${point ? "text-green-600" : ""}`;

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
      setIsPointSelecting(true);
      setCursorStyle({ isSelecting: true });
      inputRef.current?.blur(); // Remove focus to prevent interference
    }
  }, [isPointSelecting, setIsPointSelecting]);

  const handleClearPoint = useCallback(() => {
    setIsPointSelecting(false);
    setPoint(null);
    setAddressInput("");
    setCursorStyle({ isSelecting: false });
    inputRef.current?.focus();
  }, [setIsPointSelecting, setPoint]);

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
    setIsFocused(true);
    // Stop map clicking when focused on input
    if (isPointSelecting) {
      setIsPointSelecting(false);
      setCursorStyle({ isSelecting: false });
    }
  }, [isPointSelecting, setIsPointSelecting]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  return (
    <div className="flex items-center w-full gap-2">
      <div className="w-[20px] flex-shrink-0">
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
          onBlur={handleBlur}
          disabled={isGeocoding || isRouteFetching}
          className={`w-full ${isPointSelecting ? "border-blue-500 bg-blue-50" : ""} ${
            isFocused ? "border-green-500" : ""
          }`}
        />
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={handleMapClick}
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
