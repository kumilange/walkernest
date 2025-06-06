import { useCallback } from "react";
import type { z } from "zod";
import { useAtomIsAmenityOn, useAtomMaxDistance } from "../../../../stores/analysisAtoms";
import { MINS_TO_METERS_IN_WALK } from "../constants";
import type { FormSchema, MinutesToMeters } from "../types";

interface UseEventHandlersParams {
  handleClose: () => void;
  handleSubmit: (
    callback: (data: z.infer<typeof FormSchema>) => void
  ) => (e?: React.FormEvent) => void;
}

export default function useEventHandlers({ handleClose, handleSubmit }: UseEventHandlersParams) {
  const { setMaxDistance } = useAtomMaxDistance();
  const { setIsAmenityOn } = useAtomIsAmenityOn();

  const onSubmit = useCallback(
    (data: z.infer<typeof FormSchema>) => {
      const { park, supermarket, cafe, parkCheckbox, supermarketCheckbox, cafeCheckbox } = data;

      const parkMeter = MINS_TO_METERS_IN_WALK[park as keyof MinutesToMeters];
      const supermarketMeter = MINS_TO_METERS_IN_WALK[supermarket as keyof MinutesToMeters];
      const cafeMeter = MINS_TO_METERS_IN_WALK[cafe as keyof MinutesToMeters];

      setMaxDistance({
        park: parkMeter,
        supermarket: supermarketMeter,
        cafe: cafeMeter,
      });
      setIsAmenityOn({
        park: parkCheckbox,
        supermarket: supermarketCheckbox,
        cafe: cafeCheckbox,
      });
    },
    [setMaxDistance, setIsAmenityOn]
  );

  const handleCloseTouch = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      handleClose();
    },
    [handleClose]
  );

  const handleSubmitTouch = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      handleSubmit(onSubmit)();
    },
    [handleSubmit, onSubmit]
  );

  return {
    onSubmit,
    handleCloseTouch,
    handleSubmitTouch,
  };
}
