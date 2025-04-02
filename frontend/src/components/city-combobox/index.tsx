import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { useAtomCity } from "@/atoms";
import { cn } from "@/lib/misc";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CITY_LIST_ARRAY } from "@/constants";
import useEventHandlers from "./use-event-handlers";

export default function CityCombobox() {
  const [open, setOpen] = useState(false);
  const { city } = useAtomCity();
  const { handleSearch } = useEventHandlers();

  // ensure the selected city is at the top
  const sortedCityList = useMemo(() => {
    if (!city) return CITY_LIST_ARRAY;
    return [
      ...CITY_LIST_ARRAY.filter((item) => item.value === city),
      ...CITY_LIST_ARRAY.filter((item) => item.value !== city),
    ];
  }, [city]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[165px] justify-between pt-2"
        >
          {city
            ? CITY_LIST_ARRAY.find((cityItem) => cityItem.value === city)?.label
            : "Select city..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search city..." />
          <CommandList>
            <CommandEmpty>No city found.</CommandEmpty>
            <CommandGroup>
              {sortedCityList.map((cityItem) => (
                <CommandItem
                  key={cityItem.value}
                  value={cityItem.value}
                  onSelect={(value) => {
                    const isNewCitySelected = value !== city;
                    isNewCitySelected && handleSearch(cityItem);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      city === cityItem.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {cityItem.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
