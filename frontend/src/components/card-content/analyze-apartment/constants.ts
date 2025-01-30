import { MinutesToMeters } from './types';

export const MINS_TO_METERS_IN_WALK: MinutesToMeters = {
	1: 80,
	2: 160,
	3: 240,
	4: 320,
	5: 400,
	6: 480,
	7: 560,
	8: 640,
	9: 720,
	10: 800,
	11: 880,
	12: 960,
	13: 1040,
	14: 1120,
	15: 1200,
};

// Generate a map to convert walking distance to minutes
export const METERS_TO_MINS_IN_WALK: { [key: number]: number } = Object.entries(
	MINS_TO_METERS_IN_WALK,
).reduce(
	(acc, [minutes, meters]) => {
		acc[meters] = parseInt(minutes, 10);
		return acc;
	},
	{} as { [key: number]: number },
);
