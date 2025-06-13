import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";

// This type definition is a placeholder based on Nominatim's API.
// It will be replaced by the actual type from the API service in a later task.
export interface AutocompleteResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface AddressSuggestionsProps {
  suggestions: AutocompleteResult[];
  isLoading: boolean;
  onSelect: (suggestion: AutocompleteResult) => void;
  /**
   * The value of the input, used to conditionally render.
   * The list should only show when there is a value.
   */
  inputValue: string;
}

export default function AddressSuggestions({
  suggestions,
  isLoading,
  onSelect,
  inputValue,
}: AddressSuggestionsProps) {
  const hasNoResults = !isLoading && suggestions.length === 0 && inputValue.length > 2;

  // A real implementation would also hide the list if the popover is not open
  // but for storybook, we want to show it.
  // In the real implementation, the popover's `open` state will handle visibility.
  const isVisible = inputValue.length > 2;
  if (!isVisible) {
    return null;
  }

  return (
    <div className="w-[300px] rounded-md border bg-popover">
      <Command>
        <CommandList>
          {isLoading && (
            <div className="p-1">
              <Skeleton className="mb-1 h-8 w-full" />
              <Skeleton className="mb-1 h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          )}
          {hasNoResults && <CommandEmpty>No addresses found.</CommandEmpty>}
          {!isLoading && suggestions.length > 0 && (
            <CommandGroup>
              {suggestions.map((suggestion) => (
                <CommandItem
                  key={suggestion.place_id}
                  onSelect={() => onSelect(suggestion)}
                  value={suggestion.display_name}
                >
                  {/* A real implementation might highlight parts of the string that match */}
                  {suggestion.display_name}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </div>
  );
}
