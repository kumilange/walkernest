import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAnalysis } from '@/lib/fetcher';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { PopoverClose } from '@/components/ui/popover';
import { LoadingButton } from '@/components/button';
import { CITY_LIST_DICT } from '@/constants';
import { getMinutesByDistance } from './helper';
import { MINS_TO_METERS_IN_WALK } from './constants';
import { FormSchema, MinutesToMeters } from './types';
import FormFieldItem from './form-field-item';
import { generateCityDataParams } from '@/lib/misc';
import { useAtomCity, useAtomMaxDistance, useAtomIsAmenityOn, useAtomIsTmpAmenityOn } from '@/atoms';

export default function AnalyzeApartment() {
	const { city } = useAtomCity();
	const cityId = city ? CITY_LIST_DICT[city].id : null;
	const { maxDistance, setMaxDistance } = useAtomMaxDistance();
	const { isAmenityOn, setIsAmenityOn } = useAtomIsAmenityOn();
	const { isTmpAmenityOn } = useAtomIsTmpAmenityOn();
	const params = generateCityDataParams({ maxDistance, isAmenityOn });

	const { isFetching } = useAnalysis({
		cityId: cityId as number,
		...params
	});

	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			park: getMinutesByDistance(maxDistance.park),
			supermarket: getMinutesByDistance(maxDistance.supermarket),
			cafe: getMinutesByDistance(maxDistance.cafe),
			parkCheckbox: isTmpAmenityOn.park,
			supermarketCheckbox: isTmpAmenityOn.supermarket,
			cafeCheckbox: isTmpAmenityOn.cafe,
		},
	});

	const isSubmitDisabled =
		!city ||
		!form.getValues().park ||
		!form.getValues().supermarket ||
		!form.getValues().cafe ||
		!form.formState.isValid;

	const onSubmit = (data: z.infer<typeof FormSchema>) => {
		const { park, supermarket, cafe, parkCheckbox, supermarketCheckbox, cafeCheckbox } = data;
		const parkMeter =
			MINS_TO_METERS_IN_WALK[park as keyof MinutesToMeters];
		const supermarketMeter =
			MINS_TO_METERS_IN_WALK[supermarket as keyof MinutesToMeters];
		const cafeMeter =
			MINS_TO_METERS_IN_WALK[cafe as keyof MinutesToMeters];
		setMaxDistance({ park: parkMeter, supermarket: supermarketMeter, cafe: cafeMeter });
		setIsAmenityOn({ park: parkCheckbox, supermarket: supermarketCheckbox, cafe: cafeCheckbox });
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
						<FormFieldItem control={form.control} name="cafe" />
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
