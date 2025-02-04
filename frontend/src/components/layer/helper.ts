import { LayerProps } from 'react-map-gl/maplibre';
import { FeatureCollection, Feature, Geometry } from 'geojson';
import { colorMappings } from './constants';

/**
 * Generates layer styles for point, lineString, and polygon layers based on the provided idPrefix.
 * The styles are derived from a color mapping associated with the idPrefix.
 */
type LayerStyles = {
	pointLayerStyle: LayerProps;
	lineStringLayerStyle: LayerProps;
	polygonLayerStyle: LayerProps;
};
export const generateLayerStyles = (idPrefix: string): LayerStyles => {
	const baseName = Object.keys(colorMappings).find(key => idPrefix.includes(key)) || 'apartment';
	const colors = colorMappings[baseName];

	const pointLayerStyle: LayerProps = {
		id: `${idPrefix}-point-layer`,
		type: 'circle',
		source: `${idPrefix}-point-source`,
		paint: {
			'circle-radius': 6,
			'circle-color': colors.point,
			'circle-opacity': 0.6,
		},
	};

	const lineStringLayerStyle: LayerProps = {
		id: `${idPrefix}-lineString-layer`,
		type: 'line',
		source: `${idPrefix}-lineString-source`,
		layout: {
			'line-join': 'round',
			'line-cap': 'round',
		},
		paint: {
			'line-color': colors.lineString,
			'line-width': 5,
		},
	};

	const polygonLayerStyle: LayerProps = {
		id: `${idPrefix}-polygon-layer`,
		type: 'fill',
		source: `${idPrefix}-polygon-source`,
		paint: {
			'fill-color': colors.polygon,
			'fill-opacity': 0.6,
		},
	};

	return { pointLayerStyle, lineStringLayerStyle, polygonLayerStyle };
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
 * Checks if a layer should be hidden based on its ID and a list of hidden layers.
 */
export function isLayerHidden({
	id,
	hiddenLayers,
}: {
	id: string;
	hiddenLayers: string[];
}): boolean {
	return hiddenLayers.some((layer) => id.includes(layer));
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
 * @param {string} str - The input string (e.g., "123_supermarket_centroid").
 * @returns {string} The base name (e.g., "supermarket").
 */
export function extractBaseName(str: string): string {
	return str.split('_')[1];
}