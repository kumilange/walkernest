import { METERS_TO_MINS_IN_WALK } from './constants';

/**
 * Converts a given distance in meters to the equivalent time in minutes for walking.
 *
 * @param distance - The distance in meters.
 * @returns The time in minutes it takes to walk the given distance, or `undefined` if the distance is not found in the mapping.
 */
export function getMinutesByDistance(distance: number): number | undefined {
	return METERS_TO_MINS_IN_WALK[distance];
}
