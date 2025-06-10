import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { LayerProps } from "react-map-gl/maplibre";
import { polygonColorMapping } from "./constants"; // Path will be correct after constants.ts is also moved

/**
 * Get the style configuration for a polygon layer.
 */
export const getPolygonLayerStyle = ({ type }: { type: string }) => {
  const baseName =
    Object.keys(polygonColorMapping).find((key) => type.includes(key)) || "apartment";
  const color = polygonColorMapping[baseName];

  const layerStyle: LayerProps = {
    type: "fill",
    source: `${type}-polygon-source`,
    paint: {
      "fill-color": color,
      "fill-opacity": 0.6,
    },
  };

  return layerStyle;
};

/**
 * Filters features in a GeoJSON FeatureCollection by their geometry type.
 */
export function filterFeaturesByType(data: FeatureCollection, geomType: string): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: data.features.filter(
      (feature) => feature.geometry && feature.geometry.type === geomType
    ),
  };
}

/**
 * Filters out features from a FeatureCollection based on an array of skip ids.
 */
export function filterFeaturesByIds(data: FeatureCollection, skipIds: number[]): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: data.features.filter((feature) => !skipIds.includes(feature.properties?.id)),
  };
}

/**
 * Checks if a layer should be hidden based on its type and a list of hidden layers.
 */
export function isLayerHidden({
  type,
  hiddenLayers,
}: {
  type: string;
  hiddenLayers: string[];
}): boolean {
  return hiddenLayers.some((layer) => type.includes(layer));
}

/**
 * Generates a GeoJSON FeatureCollection from a given geometry.
 */
export function generateFeatureCollection(geometry: Geometry): FeatureCollection {
  const feature: Feature = {
    type: "Feature",
    geometry: geometry,
    properties: {},
  };

  const featureCollection: FeatureCollection = {
    type: "FeatureCollection",
    features: [feature],
  };

  return featureCollection;
}

/**
 * Extracts the base name from a string with an underscore suffix.
 * @param {string} str - The input string (e.g., "supermarket_centroid").
 * @returns {string} The base name (e.g., "supermarket").
 */
export function extractBaseName(str: string): string {
  return str.split("_")[0];
}

/**
 * Calculates an animated slice of coordinates based on animation progress.
 * Used for route animation to progressively reveal the route path.
 *
 * @param {number} progress - Animation progress from 0 to 1
 * @param {[number, number][]} originalCoordinates - Array of coordinate pairs [lng, lat]
 * @returns {[number, number][]} Sliced coordinates array for current animation frame
 */
export function getAnimatedSlice(
  progress: number,
  originalCoordinates: [number, number][]
): [number, number][] {
  if (originalCoordinates.length < 2 || progress <= 0) {
    return [];
  }

  if (progress >= 1) {
    return originalCoordinates;
  }

  const targetPoints = Math.ceil(progress * originalCoordinates.length);
  const clampedTargetPoints = Math.max(2, targetPoints);

  return originalCoordinates.slice(0, clampedTargetPoints);
}
