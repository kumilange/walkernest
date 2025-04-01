import { useAtomLastLayerId } from "@/atoms";
import {
  BoundaryLayer,
  RouteLayer,
  AmenitiesLayers,
  AnalysisLayers,
  FavoritesLayer,
  RoutePointsLayer,
} from "./custom-layer";

export default function LayerManager({
  city,
  cityId,
}: {
  city: string | null;
  cityId: number | null;
}) {
  const { lastLayerId } = useAtomLastLayerId();

  return (
    <>
      {city && <BoundaryLayer city={city} />}
      {cityId && (
        <>
          <AmenitiesLayers cityId={cityId} />
          <AnalysisLayers cityId={cityId} />
        </>
      )}
      <RouteLayer />
      <FavoritesLayer lastLayerId={lastLayerId} />
      <RoutePointsLayer lastLayerId={lastLayerId} />
    </>
  );
}
