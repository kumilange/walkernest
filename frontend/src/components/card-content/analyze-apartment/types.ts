import { z } from 'zod';

export type MinutesToMeters = {
	[key in
	| 1
	| 2
	| 3
	| 4
	| 5
	| 6
	| 7
	| 8
	| 9
	| 10
	| 11
	| 12
	| 13
	| 14
	| 15]: number;
};

export const FormSchema = z.object({
	park: z.preprocess(
		(value) => (value === '' ? undefined : Number(value)),
		z.number().min(1).max(15),
	),
	supermarket: z.preprocess(
		(value) => (value === '' ? undefined : Number(value)),
		z.number().min(1).max(15),
	),
	parkCheckbox: z.boolean(),
	supermarketCheckbox: z.boolean(),
});