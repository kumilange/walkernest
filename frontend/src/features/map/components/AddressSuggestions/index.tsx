import { Command, CommandEmpty, CommandItem, CommandList } from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";
import type { AutocompleteResult } from "@/features/map/api";
import { AlertCircle, Clock } from "lucide-react";
import { useId } from "react";

interface AddressSuggestionsProps {
  suggestions: AutocompleteResult[];
  isLoading: boolean;
  hasError?: boolean;
  onSelect: (suggestion: AutocompleteResult) => void;
  selectedIndex?: number;
  listboxId?: string;
}

export default function AddressSuggestions({
  suggestions,
  isLoading,
  hasError = false,
  onSelect,
  selectedIndex = -1,
  listboxId,
}: AddressSuggestionsProps) {
  const rawFallbackListboxId = useId();
  const fallbackListboxId = rawFallbackListboxId.replace(/:/g, "_");
  const actualListboxId = listboxId || fallbackListboxId;

  return (
    // The parent PopoverContent provides the styling wrapper.
    <Command shouldFilter={false}>
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
              className={hasError ? "opacity-75" : ""}
            >
              <div className="flex w-full items-center gap-2">
                {hasError && <Clock className="h-3 w-3 flex-shrink-0 text-amber-500" />}
                <span className="line-clamp-2">{suggestion.displayName}</span>
              </div>
            </CommandItem>
          ))}
        {!isLoading && suggestions.length === 0 && hasError && (
          <div className="p-2 text-center">
            <div className="mb-2 flex items-center justify-center gap-2 text-red-500">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium text-sm">Connection Error</span>
            </div>
            <p className="text-gray-600 text-xs">
              Unable to fetch address suggestions. Please check your internet connection.
            </p>
          </div>
        )}
        {!isLoading && suggestions.length === 0 && !hasError && (
          <div className="p-1">
            <CommandEmpty>No results found.</CommandEmpty>
          </div>
        )}
        {!isLoading && suggestions.length > 0 && hasError && (
          <div className="border-gray-200 border-t p-2">
            <div className="flex items-center gap-2 text-amber-600">
              <Clock className="h-3 w-3" />
              <span className="text-xs">Showing cached results</span>
            </div>
          </div>
        )}
      </CommandList>
    </Command>
  );
}
