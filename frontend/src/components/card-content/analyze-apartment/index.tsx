import { useRef } from "react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { PopoverClose } from "@/components/ui/popover";
import { useAtomCity } from "@/atoms";
import FormFieldItem from "./form-field-item";
import { useFormHandlers, useEventHandlers } from "./hooks";

export default function AnalyzeApartment() {
  const { city } = useAtomCity();
  const { form, isSubmitDisabled } = useFormHandlers({ city });
  const { onSubmit } = useEventHandlers();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid w-full items-center gap-6"
      >
        <div className="flex flex-col space-y-2">
          <h3 className="font-bold">Walking Distance</h3>
          <FormFieldItem control={form.control} name="park" />
          <FormFieldItem control={form.control} name="supermarket" />
          <FormFieldItem control={form.control} name="cafe" />
        </div>
        <div className="w-full flex justify-between">
          <PopoverClose asChild>
            <Button ref={closeButtonRef} variant="outline">
              Close
            </Button>
          </PopoverClose>
          <Button
            type="submit"
            className="flex gap-2"
            disabled={isSubmitDisabled}
          >
            Analyze
          </Button>
        </div>
      </form>
    </Form>
  );
}
