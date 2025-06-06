import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { PopoverClose } from "@/components/ui/popover";
import { useAtomCity } from "@/stores";
import { useCallback, useRef } from "react";
import FormFieldItem from "./form-field-item";
import { useEventHandlers, useFormHandlers } from "./hooks";

export default function AnalyzeApartment() {
  const { city } = useAtomCity();
  const { form, isSubmitDisabled } = useFormHandlers({ city });
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const handleClose = () => closeButtonRef.current?.click();

  const { onSubmit, handleCloseTouch, handleSubmitTouch } = useEventHandlers({
    handleClose,
    handleSubmit: form.handleSubmit,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid w-full items-center gap-6">
        <div className="flex flex-col space-y-2">
          <h3 className="font-bold">Walking Distance</h3>
          <FormFieldItem control={form.control} name="park" />
          <FormFieldItem control={form.control} name="supermarket" />
          <FormFieldItem control={form.control} name="cafe" />
        </div>
        <div className="w-full flex justify-between">
          <PopoverClose asChild>
            <Button ref={closeButtonRef} variant="outline" onTouchEnd={handleCloseTouch}>
              Close
            </Button>
          </PopoverClose>
          <Button
            type="submit"
            className="flex gap-2"
            disabled={isSubmitDisabled}
            onTouchEnd={handleSubmitTouch}
          >
            Analyze
          </Button>
        </div>
      </form>
    </Form>
  );
}
