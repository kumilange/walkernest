import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks";
import type { FavoriteItem } from "@/types";
import { addToLocalStorageList } from "@/utils/localstorage";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Feature, GeoJsonProperties, Point } from "geojson";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { fetchFavorites } from "../../../api";
import { useAtomFavItems } from "../../../stores/favoritesAtoms";

const FormSchema = z.object({
  favorite: z.string().min(2, {
    message: "Must be at least 2 characters.",
  }),
});

// Type guard for Feature<Point, GeoJsonProperties>
// biome-ignore lint/suspicious/noExplicitAny: Type guard requires any for flexible object checking
function isFeaturePoint(obj: any): obj is Feature<Point, GeoJsonProperties> {
  return (
    obj &&
    obj.type === "Feature" &&
    obj.geometry &&
    obj.geometry.type === "Point" &&
    Array.isArray(obj.geometry.coordinates)
  );
}

interface UseFavoriteFormParams {
  city: string;
  // biome-ignore lint/suspicious/noExplicitAny: GeoJSON properties can be any type
  properties: Record<string, any>;
  handlePopupClose: () => void;
  defaultName: string;
}

export default function useFavoriteForm({
  city,
  properties,
  handlePopupClose,
  defaultName,
}: UseFavoriteFormParams) {
  const { toast } = useToast();
  const { setFavItems } = useAtomFavItems();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      favorite: defaultName,
    },
  });

  const isSubmitDisabled =
    !form.getValues().favorite || !form.formState.isValid || form.formState.isSubmitting;

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    try {
      const response = await fetchFavorites([properties.id]);

      if (!response[0] || !isFeaturePoint(response[0])) {
        throw new Error("Invalid favorite feature returned from API.");
      }

      const feature = response[0];
      const item: FavoriteItem = {
        id: feature?.properties?.id,
        name: data.favorite,
        city,
        feature,
      };

      addToLocalStorageList("favorites", item);
      setFavItems((prev) => [...prev, item]);
      handlePopupClose();
      toast({
        description: "Favorites saved successfully.",
        className: "bg-green-100 text-green-800 text-md",
        duration: 3000,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Save favorites failed.",
        description: "There was a problem with your request.",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
        duration: 10000,
      });
    }
  };

  return {
    form,
    isSubmitDisabled,
    onSubmit,
    FormSchema,
  };
}
