import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";
import type { AutocompleteResult } from "@/features/map/api";

interface AddressSuggestionsProps {
  suggestions: AutocompleteResult[];
  isLoading: boolean;
  onSelect: (suggestion: AutocompleteResult) => void;
}

export default function AddressSuggestions({
  suggestions,
  isLoading,
  onSelect,
}: AddressSuggestionsProps) {
  const hasNoResults = !isLoading && suggestions.length === 0;

  return (
    // The parent PopoverContent provides the styling wrapper.
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
                key={suggestion.id}
                onSelect={() => onSelect(suggestion)}
                value={suggestion.displayName}
              >
                {/* A real implementation might highlight parts of the string that match */}
                {suggestion.displayName}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  );
}
