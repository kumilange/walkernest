import { LayerProps } from 'react-map-gl/maplibre';
import { FeatureCollection, Feature, Geometry } from 'geojson';
import { twColors } from './constants';

export const generateLayerStyles = (idPrefix: string) => {
	let colors = {
		point: twColors.apartment,
		lineString: twColors.apartment,
		polygon: twColors.apartment,
	};

	if (idPrefix.includes('supermarket')) {
		colors = {
			point: twColors.supermarket,
			lineString: twColors.supermarket,
			polygon: twColors.supermarket,
		};
	} else if (idPrefix.includes('park')) {
		colors = {
			point: twColors.park,
			lineString: twColors.park,
			polygon: twColors.park,
		};
	} else if (idPrefix.includes('cafe')) {
		colors = {
			point: twColors.cafe,
			lineString: twColors.cafe,
			polygon: twColors.cafe,
		};
	}

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
 *
 * @param {FeatureCollection} data - The GeoJSON FeatureCollection to filter.
 * @param {string} type - The geometry type to filter by (e.g., 'Point', 'LineString', 'Polygon').
 * @returns {FeatureCollection} - A new FeatureCollection containing only features of the specified type.
 */
export function filterFeaturesByType(
	data: FeatureCollection,
	type: string,
): FeatureCollection {
	return {
		type: 'FeatureCollection',
		features: data.features.filter((feature) => feature.geometry.type === type),
	};
}

export function filterFeaturesByIds(
	data: FeatureCollection,
	ids: number[],
): FeatureCollection {
	return {
		type: 'FeatureCollection',
		features: data.features.filter(
			(feature) => !ids.includes(feature.properties?.id),
		),
	};
}

/**
 * Checks if a layer should be hidden based on its ID and a list of hidden layers.
 *
 * @param {Object} params - The parameters object.
 * @param {string} params.id - The ID of the layer to check.
 * @param {string[]} params.hiddenLayers - The list of hidden layer IDs.
 * @returns {boolean} - True if the layer should be hidden, false otherwise.
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
 *
 * @param {Geometry} geometry - The GeoJSON geometry object to be converted into a FeatureCollection.
 * @returns {FeatureCollection} - A GeoJSON FeatureCollection containing the provided geometry as a single feature.
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
	return str.split('_')[1];
}