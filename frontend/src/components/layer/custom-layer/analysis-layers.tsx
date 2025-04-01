import { useEffect } from "react";
import { useAnalysis } from "@/lib/fetcher";
import apartmentIconPath from "@/assets/apartment-icon.png";
import {
  useAtomIsAmenityOn,
  useAtomFavItems,
  useAtomMaxDistance,
} from "@/atoms";
import { useToast } from "@/hooks";
import { ToastAction } from "@/components/ui/toast";
import { generateCityDataParams } from "@/lib/misc";
import { ClusterLayer, PolygonLayer, IconLayer } from "../custom-base-layer";

export default function AnalysisLayers({ cityId }: { cityId: number }) {
  const { toast } = useToast();
  const { maxDistance } = useAtomMaxDistance();
  const { isAmenityOn } = useAtomIsAmenityOn();
  const params = generateCityDataParams({ maxDistance, isAmenityOn });
  const { favItems } = useAtomFavItems();
  const favIds = favItems.map((item) => item.id);

  const { data, error } = useAnalysis({
    cityId,
    ...params,
  });

  useEffect(() => {
    if (data) {
      toast({
        description: `${data?.centroid.features.length} apartments found.`,
        className: "bg-green-100 text-green-800 text-md",
        duration: 3000,
      });
      return;
    }

    if (error) {
      toast({
        variant: "destructive",
        title: "Analyzing apartment failed.",
        description: "There was a problem with your request.",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
        duration: 10000,
      });
    }
  }, [data, error, toast]);

  return (
    <>
      {data?.polygon && (
        <PolygonLayer data={data.polygon} type={`result`} cityId={cityId} />
      )}
      {data?.centroid && (
        <>
          <IconLayer
            data={data.centroid}
            imageType={`result`}
            imagePath={apartmentIconPath}
            skipIds={favIds}
            cityId={cityId}
          />
          <ClusterLayer data={data.centroid} type={`cluster`} cityId={cityId} />
        </>
      )}
    </>
  );
}
