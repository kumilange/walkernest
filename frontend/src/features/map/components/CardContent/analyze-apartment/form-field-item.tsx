import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAtomIsTmpAmenityOn } from "@/features/map/stores";
import { capitalize } from "@/utils/misc";
import { Coffee, ShoppingCart, Trees } from "lucide-react";
import {
  type Control,
  Controller,
  type FieldValues,
  type Path,
  UseFormReturn,
} from "react-hook-form";

type FormFieldItemProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
};

const IconMap = {
  park: <Trees />,
  supermarket: <ShoppingCart />,
  cafe: <Coffee />,
};

export default function FormFieldItem<T extends FieldValues>({
  control,
  name,
}: FormFieldItemProps<T>) {
  const { isTmpAmenityOn, setIsTmpAmenityOn } = useAtomIsTmpAmenityOn();
  const isChecked = isTmpAmenityOn[name as keyof typeof isTmpAmenityOn];

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={`grid grid-cols-12 gap-2 space-y-1.5 ${!isChecked ? "opacity-50" : ""}`}
        >
          <div className="flex items-center col-span-6">
            {IconMap[name as keyof typeof IconMap]}
            <FormLabel htmlFor={name} className="ml-2">
              {capitalize(name)}
            </FormLabel>
          </div>
          <div className="flex items-center col-span-6 ml-2">
            <FormControl>
              <Input
                id={name}
                type="number"
                placeholder="5"
                min="1"
                max="15"
                className="w-[60px]"
                disabled={!isChecked}
                {...field}
              />
            </FormControl>
            <p className="ml-2 mr-auto text-sm">min.</p>
            <Controller
              control={control}
              name={`${name}Checkbox` as Path<T>}
              render={({ field: checkboxField }) => (
                <Checkbox
                  id={`${name}Checkbox`}
                  checked={checkboxField.value}
                  onCheckedChange={(checked: boolean) => {
                    checkboxField.onChange(checked);
                    setIsTmpAmenityOn({
                      ...isTmpAmenityOn,
                      [name]: checked,
                    });
                  }}
                />
              )}
            />
          </div>
        </FormItem>
      )}
    />
  );
}
