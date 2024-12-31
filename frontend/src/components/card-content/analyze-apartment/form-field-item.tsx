import { Control, FieldValues, Path } from 'react-hook-form';
import { Trees, ShoppingCart } from 'lucide-react';
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { capitalize } from '@/lib/misc';

type FormFieldItemProps<T extends FieldValues> = {
	control: Control<T>;
	name: Path<T>;
};

const IconMap = {
	park: <Trees />,
	supermarket: <ShoppingCart />,
};

export default function FormFieldItem<T extends FieldValues>({
	control,
	name,
}: FormFieldItemProps<T>) {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem className="grid grid-cols-12 gap-2 space-y-1.5">
					<div className="flex items-center col-span-7">
						{IconMap[name as keyof typeof IconMap]}
						<FormLabel htmlFor={name} className="ml-2">
							{capitalize(name)}
						</FormLabel>
					</div>
					<div className="flex items-center col-span-5">
						<FormControl>
							<Input
								id={name}
								type="number"
								placeholder="5"
								min="1"
								max="15"
								className="w-[60px]"
								{...field}
							/>
						</FormControl>
						<p className="ml-2 text-sm">mins</p>
					</div>
				</FormItem>
			)}
		/>
	);
}
