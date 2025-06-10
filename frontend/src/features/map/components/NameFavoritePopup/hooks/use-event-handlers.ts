import { useCallback } from "react";

interface UseEventHandlersParams {
  handlePopupClose: () => void;
}

export default function useEventHandlers({ handlePopupClose }: UseEventHandlersParams) {
  const handleCancelTouch = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      handlePopupClose();
    },
    [handlePopupClose]
  );

  return {
    handleCancelTouch,
  };
}
