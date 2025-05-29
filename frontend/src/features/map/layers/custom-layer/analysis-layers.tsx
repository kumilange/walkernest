import apartmentIconPath from "@/assets/apartment-icon.png";
import { ToastAction } from "@/components/ui/toast";
import { useAnalysis } from "@/features/map/api";
import { useAtomFavItems, useAtomIsAmenityOn, useAtomMaxDistance } from "@/features/map/stores";
import { useToast } from "@/hooks";
import { generateCityDataParams } from "@/utils/misc";
import { Point } from "geojson";
import { useEffect } from "react";
import { ClusterLayer, IconLayer, PolygonLayer } from "../custom-base-layer"; // Corrected path
import AmenityLayer from "./amenities-layers";

export default function AnalysisLayers({ cityId }: { cityId: number }) {
  const { toast } = useToast();
  const { maxDistance } = useAtomMaxDistance();
  const { isAmenityOn } = useAtomIsAmenityOn();
  const params = generateCityDataParams({ maxDistance, isAmenityOn });
  const { favItems } = useAtomFavItems();
  const favIds = favItems.map((item) => item.id);

  const { data, error, refetch } = useAnalysis({
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
        action: (
          <ToastAction altText="Try again" onClick={() => refetch()}>
            Try again
          </ToastAction>
        ),
        duration: 10000,
      });
    }
  }, [data, error, toast, refetch]);

  return (
    <>
      {data?.polygon && <PolygonLayer data={data.polygon} type={"result"} cityId={cityId} />}
      {data?.centroid && (
        <>
          <IconLayer
            data={data.centroid}
            imageType={"result"}
            imagePath={apartmentIconPath}
            skipIds={favIds}
            cityId={cityId}
          />
          <ClusterLayer data={data.centroid} type={"cluster"} cityId={cityId} />
        </>
      )}
    </>
  );
}
