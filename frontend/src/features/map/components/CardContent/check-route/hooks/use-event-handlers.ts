import type { Route, RoutePoint } from "@/types";
import { setCursorStyle } from "@/utils/misc";
import { useCallback } from "react";

interface UseEventHandlersParams {
  isPointSelecting: boolean;
  setIsPointSelecting: (isPointSelecting: boolean) => void;
  setRoute: (route: Route | null) => void;
  setPoint: (point: RoutePoint | null) => void;
  setAddressInput: (input: string) => void;
  onGeocodeAddress: (address: string, isStarting: boolean) => Promise<void>;
  isStarting: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  addressInput: string;
  point: RoutePoint | null;
  setIsGeocoding: (isGeocoding: boolean) => void;
}

export default function useEventHandlers({
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
}: UseEventHandlersParams) {
  const handleMapClick = useCallback(() => {
    if (!isPointSelecting) {
      setRoute(null);
      setPoint(null);
      setAddressInput("");
      setIsPointSelecting(true);
      setCursorStyle({ isSelecting: true });
      inputRef.current?.blur(); // Remove focus to prevent interference
    }
  }, [isPointSelecting, setIsPointSelecting, setRoute, setPoint, setAddressInput, inputRef]);

  const handleClearPoint = useCallback(() => {
    setIsPointSelecting(false);
    setPoint(null);
    setAddressInput("");
    setCursorStyle({ isSelecting: false });
    inputRef.current?.focus();
  }, [setIsPointSelecting, setPoint, setAddressInput, inputRef]);

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

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setAddressInput(e.target.value);
      // Clear point if user starts typing a different address
      if (point && e.target.value !== point.name) {
        setPoint(null);
      }
    },
    [point, setPoint, setAddressInput]
  );

  const handleFocus = useCallback(() => {
    // Stop map clicking when focused on input
    if (isPointSelecting) {
      setIsPointSelecting(false);
      setCursorStyle({ isSelecting: false });
    }
  }, [isPointSelecting, setIsPointSelecting]);

  return {
    handleMapClick,
    handleClearPoint,
    handleMapClickTouch,
    handleClearPointTouch,
    handleInputChange,
    handleFocus,
  };
}
