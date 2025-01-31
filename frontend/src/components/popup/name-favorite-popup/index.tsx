import { Popup, LngLat } from 'react-map-gl/maplibre';
import { Feature, GeoJsonProperties, Point } from 'geojson';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSetAtom } from 'jotai';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { CloseButton } from '@/components/button';
import { ToastAction } from '@/components/ui/toast';
import { addToLocalStorageList } from '@/lib/localstorage';
import { favItemsAtom } from '@/atoms';
import { fetchFavorites } from '@/lib/fetcher';
import { useToast } from '@/hooks';
import type { FavoriteItem } from '@/types';

type NameFavoritePopupProps = {
	city: string;
	lngLat: LngLat;
	properties: Record<string, any>;
	handlePopupClose: () => void;
};

const FormSchema = z.object({
	favorite: z.string().min(2, {
		message: 'Must be at least 2 characters.',
	}),
});

export default function NameFavoritePopup({
	city,
	lngLat,
	properties,
	handlePopupClose,
}: NameFavoritePopupProps) {
	const { toast } = useToast();
	const setFavItems = useSetAtom(favItemsAtom);
	const defaultName =
		properties?.name && properties?.name !== 'N/A' ? properties.name : '';

	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			favorite: defaultName,
		},
	});

	const isSubmitDisabled =
		!form.getValues().favorite ||
		!form.formState.isValid ||
		form.formState.isSubmitting;

	const onSubmit = async (data: z.infer<typeof FormSchema>) => {
		try {
			const response = await fetchFavorites([properties.id]);
			const feature = response[0] as Feature<Point, GeoJsonProperties>;
			const item: FavoriteItem = {
				id: feature?.properties?.id,
				name: data.favorite,
				city,
				feature,
			};

			addToLocalStorageList('favorites', item);
			setFavItems((prev) => [...prev, item]);
			handlePopupClose();
			toast({
				description: 'Favorites saved successfully.',
				className: 'bg-green-100 text-green-800 text-md',
				duration: 3000,
			});
		} catch (error) {
			toast({
				variant: 'destructive',
				title: 'Save favorites failed.',
				description: 'There was a problem with your request.',
				action: <ToastAction altText="Try again">Try again</ToastAction>,
				duration: 10000,
			});
		}
	};

	return (
		<Popup
			longitude={lngLat.lng}
			latitude={lngLat.lat}
			anchor="bottom"
			onClose={handlePopupClose}
			className="relative animate-fade-in delay-200 opacity-100 favorite"
		>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="flex flex-col gap-4"
				>
					<FormField
						control={form.control}
						name="favorite"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Name your favorite item</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<div className="w-full flex justify-between">
						<Button variant="ghost" onClick={handlePopupClose}>
							Cancel
						</Button>
						<Button
							className={`primary transition-colors`}
							disabled={isSubmitDisabled}
							type="submit"
						>
							Save
						</Button>
					</div>
				</form>
			</Form>
			<div className="absolute top-1 right-1">
				<CloseButton handleClose={handlePopupClose} />
			</div>
		</Popup>
	);
}
