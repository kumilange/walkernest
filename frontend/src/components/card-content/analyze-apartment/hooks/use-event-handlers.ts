import { z } from "zod";
import { useAtomMaxDistance, useAtomIsAmenityOn } from "@/atoms";
import { FormSchema, MinutesToMeters } from "../types";
import { MINS_TO_METERS_IN_WALK } from "../constants";

export default function useEventHandlers() {
  const { setMaxDistance } = useAtomMaxDistance();
  const { setIsAmenityOn } = useAtomIsAmenityOn();

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    const {
      park,
      supermarket,
      cafe,
      parkCheckbox,
      supermarketCheckbox,
      cafeCheckbox,
    } = data;

    const parkMeter = MINS_TO_METERS_IN_WALK[park as keyof MinutesToMeters];
    const supermarketMeter =
      MINS_TO_METERS_IN_WALK[supermarket as keyof MinutesToMeters];
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
  };

  return { onSubmit };
}
