import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAtom, useAtomValue } from 'jotai';
import { cityAtom, maxDistanceAtom, isAmenityOnAtom } from '@/atoms';
import { useDynamicCityData } from '@/lib/fetcher';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { PopoverClose } from '@/components/ui/popover';
import { LoadingButton } from '@/components/button';
import { CITY_LIST_MAP } from '@/constants';
import { getMinutesByDistance } from './helper';
import { MINS_TO_METERS_IN_WALK } from './constants';
import { FormSchema, MinutesToMeters } from './types';
import FormFieldItem from './form-field-item';
import { generateCityDataParams } from '@/lib/misc';

export default function AnalyzeApartment() {
	const city = useAtomValue(cityAtom);
	const cityId = city ? CITY_LIST_MAP[city].id : null;
	const [maxDistance, setMaxDistance] = useAtom(maxDistanceAtom);
	const [isAmenityOn, setIsAmenityOn] = useAtom(isAmenityOnAtom);
	const params = generateCityDataParams({ maxDistance, isAmenityOn });

	const { isFetching } = useDynamicCityData({
		cityId: cityId as number,
		...params
	});

	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			park: getMinutesByDistance(maxDistance.park),
			supermarket: getMinutesByDistance(maxDistance.supermarket),
			parkCheckbox: true,
			supermarketCheckbox: true,
		},
	});

	const isSubmitDisabled =
		!city ||
		!form.getValues().park ||
		!form.getValues().supermarket ||
		!form.formState.isValid;

	const onSubmit = (data: z.infer<typeof FormSchema>) => {
		const { park, supermarket, parkCheckbox, supermarketCheckbox } = data;
		const parkMeter =
			MINS_TO_METERS_IN_WALK[park as keyof MinutesToMeters];
		const supermarketMeter =
			MINS_TO_METERS_IN_WALK[supermarket as keyof MinutesToMeters];
		setMaxDistance({ park: parkMeter, supermarket: supermarketMeter });
		setIsAmenityOn({ park: parkCheckbox, supermarket: supermarketCheckbox });
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
