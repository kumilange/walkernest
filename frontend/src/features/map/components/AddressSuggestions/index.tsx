import { Command, CommandEmpty, CommandItem, CommandList } from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";
import type { AutocompleteResult } from "@/features/map/api";
import { useId } from "react";

interface AddressSuggestionsProps {
  suggestions: AutocompleteResult[];
  isLoading: boolean;
  onSelect: (suggestion: AutocompleteResult) => void;
  selectedIndex?: number;
  listboxId?: string;
}

export default function AddressSuggestions({
  suggestions,
  isLoading,
  onSelect,
  selectedIndex = -1,
  listboxId,
}: AddressSuggestionsProps) {
  const rawFallbackListboxId = useId();
  const fallbackListboxId = rawFallbackListboxId.replace(/:/g, "_");
  const actualListboxId = listboxId || fallbackListboxId;

  return (
    // The parent PopoverContent provides the styling wrapper.
    <Command>
      {/* biome-ignore lint/a11y/useSemanticElements: Required for WAI-ARIA combobox pattern */}
      <CommandList id={actualListboxId} role="listbox">
        {isLoading && (
          // biome-ignore lint/a11y/useSemanticElements: Required for screen reader status updates
          <div className="p-1" role="status" aria-label="Loading address suggestions">
            <Skeleton className="mb-1 h-8 w-full" />
            <Skeleton className="mb-1 h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        )}
        {!isLoading &&
          suggestions.length > 0 &&
          suggestions.map((suggestion, index) => (
            <CommandItem
              key={suggestion.id}
              id={`${actualListboxId}-option-${index}`}
              // biome-ignore lint/a11y/useSemanticElements: Required for WAI-ARIA combobox pattern
              role="option"
              aria-selected={index === selectedIndex}
              data-selected={index === selectedIndex}
              onSelect={() => onSelect(suggestion)}
            >
              {suggestion.displayName}
            </CommandItem>
          ))}
        {!isLoading && suggestions.length === 0 && (
          <div className="p-1">
            <CommandEmpty>No results found.</CommandEmpty>
          </div>
        )}
      </CommandList>
    </Command>
  );
}
