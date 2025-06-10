import { CloseButton } from "@/components/button";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { type LngLat, Popup } from "react-map-gl/maplibre";
import { useEventHandlers, useFavoriteForm } from "./hooks";

interface NameFavoritePopupProps {
  city: string;
  lngLat: LngLat;
  // biome-ignore lint/suspicious/noExplicitAny: GeoJSON properties can be any type
  properties: Record<string, any>;
  handlePopupClose: () => void;
}

export default function NameFavoritePopup({
  city,
  lngLat,
  properties,
  handlePopupClose,
}: NameFavoritePopupProps) {
  const { handleCancelTouch } = useEventHandlers({ handlePopupClose });
  const defaultName = properties?.name && properties?.name !== "N/A" ? properties.name : "";

  const { form, isSubmitDisabled, onSubmit, FormSchema } = useFavoriteForm({
    city,
    properties,
    handlePopupClose,
    defaultName,
  });

  return (
    <Popup
      longitude={lngLat.lng}
      latitude={lngLat.lat}
      anchor="bottom"
      onClose={handlePopupClose}
      className="relative animate-fade-in delay-200 opacity-100 favorite"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="favorite"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name your favorite item</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="w-full flex justify-between">
            <Button variant="ghost" onClick={handlePopupClose} onTouchEnd={handleCancelTouch}>
              Cancel
            </Button>
            <Button
              className={"primary transition-colors"}
              disabled={isSubmitDisabled}
              type="submit"
            >
              Save
            </Button>
          </div>
        </form>
      </Form>
      <div className="absolute top-1 right-1">
        <CloseButton handleClose={handlePopupClose} />
      </div>
    </Popup>
  );
}
