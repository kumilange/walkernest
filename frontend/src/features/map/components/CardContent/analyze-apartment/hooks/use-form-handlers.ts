import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { useAtomIsTmpAmenityOn, useAtomMaxDistance } from "../../../../stores/analysisAtoms";
import { METERS_TO_MINS_IN_WALK } from "../constants";
import { FormSchema } from "../types";

export default function useFormHandlers({ city }: { city: string | null }) {
  const { maxDistance } = useAtomMaxDistance();
  const { isTmpAmenityOn } = useAtomIsTmpAmenityOn();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      park: METERS_TO_MINS_IN_WALK[maxDistance.park],
      supermarket: METERS_TO_MINS_IN_WALK[maxDistance.supermarket],
      cafe: METERS_TO_MINS_IN_WALK[maxDistance.cafe],
      parkCheckbox: isTmpAmenityOn.park,
      supermarketCheckbox: isTmpAmenityOn.supermarket,
      cafeCheckbox: isTmpAmenityOn.cafe,
    },
  });

  const isSubmitDisabled =
    !city ||
    !form.getValues().park ||
    !form.getValues().supermarket ||
    !form.getValues().cafe ||
    !form.formState.isValid;

  return { form, isSubmitDisabled };
}
