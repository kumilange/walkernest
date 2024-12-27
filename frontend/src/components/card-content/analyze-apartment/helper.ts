import { METERS_TO_MINS_IN_WALK } from './constants';

// Function to return minutes by passed walking distance
export function getMinutesByDistance(distance: number): number | undefined {
	return METERS_TO_MINS_IN_WALK[distance];
}
