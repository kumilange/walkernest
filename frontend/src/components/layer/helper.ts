import { LayerProps } from 'react-map-gl/maplibre';
import { FeatureCollection, Feature, Geometry } from 'geojson';
import { polygonColorMapping } from './constants';

/**
 * Get the style configuration for a polygon layer.
 */
export const getPolygonLayerStyle = (type: string) => {
	const baseName = Object.keys(polygonColorMapping).find(key => type.includes(key)) || 'apartment';
	const color = polygonColorMapping[baseName];

	const layerStyle: LayerProps = {
		id: `${type}-polygon-layer`,
		type: 'fill',
		source: `${type}-polygon-source`,
		paint: {
			'fill-color': color,
			'fill-opacity': 0.6,
		},
	};

	return layerStyle;
};

/**
 * Filters features in a GeoJSON FeatureCollection by their geometry type.
 */
export function filterFeaturesByType(
	data: FeatureCollection,
	geomType: string,
): FeatureCollection {
	return {
		type: 'FeatureCollection',
		features: data.features.filter((feature) => feature.geometry.type === geomType),
	};
}

/**
 * Filters out features from a FeatureCollection based on an array of skip ids.
 */
export function filterFeaturesByIds(
	data: FeatureCollection,
	skipIds: number[],
): FeatureCollection {
	return {
		type: 'FeatureCollection',
		features: data.features.filter(
			(feature) => !skipIds.includes(feature.properties?.id),
		),
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
export function generateFeatureCollection(
	geometry: Geometry,
): FeatureCollection {
	const feature: Feature = {
		type: 'Feature',
		geometry: geometry,
		properties: {},
	};

	const featureCollection: FeatureCollection = {
		type: 'FeatureCollection',
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
	return str.split('_')[0];
}
