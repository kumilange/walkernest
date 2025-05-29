import cafeIconPath from "@/assets/cafe-icon.png";
import supermarketIconPath from "@/assets/supermarket-icon.png";
import { useAmenities } from "@/features/map/api";
import { useToast } from "@/hooks";
import { memo, useEffect } from "react";
import { IconLayer, PolygonLayer } from "../custom-base-layer"; // Corrected path
import { extractBaseName } from "../helper"; // Corrected path

const iconPaths: { [key: string]: string } = {
  supermarket: supermarketIconPath,
  cafe: cafeIconPath,
};

export default function AmenitiesLayers({ cityId }: { cityId: number }) {
  const { toast } = useToast();
  const { data, error } = useAmenities(cityId);

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        description: "Park, supermarket and cafe data fetch failed.",
        duration: 10000,
      });
    }
  }, [error, toast]);

  return (
    <>
      {data?.geojsons.map((geojson, index) => {
        const type = data.types[index];
        const isCentroid = type.includes("centroid");

        if (isCentroid) {
          const baseName = extractBaseName(type);
          const imagePath = iconPaths[baseName];
          if (!imagePath) {
            return null;
          }

          return (
            <IconLayer
              key={`${cityId}-${type}`}
              cityId={cityId}
              data={geojson}
              imageType={baseName}
              imagePath={imagePath}
            />
          );
        }
        return (
          <PolygonLayer key={`${cityId}-${type}`} cityId={cityId} data={geojson} type={type} />
        );
      })}
    </>
  );
}
