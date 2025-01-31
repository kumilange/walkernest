import { METERS_TO_MINS_IN_WALK } from './constants';

/**
 * Converts a given distance in meters to the equivalent time in minutes for walking.
 */
export function getMinutesByDistance(distance: number): number | undefined {
	return METERS_TO_MINS_IN_WALK[distance];
}
