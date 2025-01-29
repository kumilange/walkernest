import { useForm } from 'react-hook-form';
import { useAtom, useAtomValue } from 'jotai';
import { cityAtom, walkingDistanceAtom } from '@/atoms';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDynamicCityData } from '@/lib/fetcher';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { PopoverClose } from '@/components/ui/popover';
import { LoadingButton } from '@/components/button';
import { CITY_LIST_MAP } from '@/constants';
import { getMinutesByDistance } from './helper';
import { MINS_TO_METERS_IN_WALK } from './constants';
import FormFieldItem from './form-field-item';

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

const FormSchema = z.object({
	park: z.preprocess(
		(value) => (value === '' ? undefined : Number(value)),
		z.number().min(1).max(15),
	),
	supermarket: z.preprocess(
		(value) => (value === '' ? undefined : Number(value)),
		z.number().min(1).max(15),
	),
});

export default function AnalyzeApartment() {
	const city = useAtomValue(cityAtom);
	const cityId = city ? CITY_LIST_MAP[city].id : null;
	const [walkingDistance, setWalkingDistance] = useAtom(walkingDistanceAtom);

	const { isFetching } = useDynamicCityData({
		cityId: cityId as number,
		maxMeterPark: walkingDistance.park,
		maxMeterSupermarket: walkingDistance.supermarket,
	});

	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			park: getMinutesByDistance(walkingDistance.park),
			supermarket: getMinutesByDistance(walkingDistance.supermarket),
		},
	});

	const isSubmitDisabled =
		!city ||
		!form.getValues().park ||
		!form.getValues().supermarket ||
		!form.formState.isValid;

	const onSubmit = (data: z.infer<typeof FormSchema>) => {
		const parkMeter =
			MINS_TO_METERS_IN_WALK[data.park as keyof MinutesToMeters];
		const supermarketMeter =
			MINS_TO_METERS_IN_WALK[data.supermarket as keyof MinutesToMeters];
		setWalkingDistance({ park: parkMeter, supermarket: supermarketMeter });
	};

	return (
		<>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="grid w-full items-center gap-6"
				>
					<div className="flex flex-col space-y-2">
						<h3 className="font-bold">Walking Distance</h3>
						<FormFieldItem control={form.control} name="park" />
						<FormFieldItem control={form.control} name="supermarket" />
					</div>
					{/* Footer */}
					<div className="w-full flex justify-between">
						<PopoverClose asChild>
							<Button variant="outline">Close</Button>
						</PopoverClose>
						{isFetching ? (
							<LoadingButton />
						) : (
							<Button
								type="submit"
								className="flex gap-2"
								disabled={isSubmitDisabled}
							>
								Analyze
							</Button>
						)}
					</div>
				</form>
			</Form>
		</>
	);
}
