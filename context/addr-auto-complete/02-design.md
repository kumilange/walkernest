# Address Autocomplete Feature Design Policy Document

## 📋 Overview

This document defines the implementation strategy and technical design for adding autocomplete functionality to the address input fields in the route planning system. The design leverages the existing OpenStreetMap Nominatim API while introducing client-side caching, rate limiting, and geographic prioritization to create an optimal user experience.

## 🔍 Requirements Analysis

Based on the requirements analysis (REQ-1 through REQ-17), the key implementation points are:

### Core Functionality (REQ-1 to REQ-10)
- **Real-time Suggestions**: Provide autocomplete suggestions with 300ms debounce and 3-character minimum
- **Dropdown Interface**: Display suggestions in dropdown with keyboard navigation and mouse support
- **Seamless Integration**: Maintain existing functionality while adding autocomplete features
- **Accessibility**: Full keyboard navigation and ARIA compliance

### Performance & Caching (REQ-11 to REQ-13)
- **Client-side Caching**: Implement caching for recent searches to improve performance and reduce API calls
- **Rate Limiting**: Enforce 1-request-per-second limit with additional throttling mechanisms
- **Geographic Prioritization**: Order suggestions by distance from current map view rather than API relevance

### User Experience (REQ-14 to REQ-15)
- **Platform Consistency**: Maintain identical UX between desktop and mobile devices
- **Error Resilience**: Implement two-tier fallback system (cached results → graceful degradation)

### Scope Limitations (REQ-16 to REQ-17)
- **Analytics**: No usage tracking implementation (deferred for future consideration)
- **Internationalization**: No multi-language support (deferred for future consideration)

## 🛠 Implementation Policy

### Architecture Choice

**Selected Architecture: Enhanced Component with Custom Hook Pattern**

The implementation will extend the existing `SelectPoint` component with a new custom hook `useAddressAutocomplete` that encapsulates all autocomplete logic. This approach maintains separation of concerns while integrating seamlessly with the existing architecture.

### Component Design

#### Core Components Structure

```
SelectPoint (Enhanced)
├── AddressSuggestions (New)
│   ├── SuggestionItem (New)
│   └── LoadingIndicator (Existing)
└── useAddressAutocomplete (New Hook)
    ├── useDebounce (New Utility Hook)
    ├── useCache (New Utility Hook)
    └── useRateLimit (New Utility Hook)
```

#### Component Responsibilities

**SelectPoint (Enhanced)**
- Maintains existing functionality
- Integrates autocomplete dropdown
- Manages focus and keyboard events
- Coordinates between input and suggestions

**AddressSuggestions (New)**
- Renders suggestion dropdown
- Handles suggestion selection
- Manages keyboard navigation highlighting
- Provides loading and empty states

**useAddressAutocomplete (New Hook)**
- Manages autocomplete state and logic
- Handles API requests with rate limiting
- Implements caching strategy
- Provides suggestion filtering and prioritization

### Data Flow

```
User Input → Debounce → Rate Limit Check → Cache Check → API Request → Geographic Sort → UI Update
     ↓
Suggestion Selection → Input Population → Geocoding → Route Calculation
```

## 🔄 Implementation Method Options and Decision

### Option 1: Third-party Autocomplete Library

**Description**: Use libraries like `react-select` or `downshift` for autocomplete functionality.

**Pros**: 
- Pre-built accessibility features
- Extensive customization options
- Battle-tested implementation

**Cons**: 
- Additional bundle size
- Learning curve for customization
- May not integrate well with existing styling
- Overkill for specific use case

### Option 2: Shadcn UI Command-based Combobox

**Description**: Utilize the existing *shadcn/ui* `Command` primitives (already used in `CityCombobox`) wrapped in a `Popover` to implement the autocomplete dropdown. The input remains the current `Input` component, while suggestions are rendered via `CommandList`/`CommandItem`.

**Pros**:
- Aligns with current design system – *shadcn/ui* components (`Button`, `Input`, `Popover`, `Command`) are already in use
- Out-of-the-box accessibility: ARIA roles and keyboard navigation handled by `cmdk` under the hood
- Minimal additional bundle size (library already included)
- Faster development: reuse of existing `CityCombobox` patterns
- Consistent look-and-feel with the rest of the application

**Cons**:
- Limited customization compared with a fully bespoke solution (styling must follow `Command` structure)
- Depends on `cmdk` behaviour; deep custom behaviour may require work-arounds

### Option 3: Custom Implementation with Existing UI Components

**Description**: Build the autocomplete dropdown entirely from scratch using plain `div` elements and existing utility hooks.

**Pros**:
- Full control over markup and behaviour
- No dependency on external abstraction layers

**Cons**:
- Longer development time and higher maintenance cost
- Need to hand-roll accessibility features and keyboard navigation
- Risk of inconsistencies with other parts of the UI

### Decision: **Adopt Shadcn UI Command-based Combobox**

After reviewing the repository, **shadcn/ui** primitives (`Command`, `Popover`, etc.) are already integrated and successfully power the existing `CityCombobox`. Leveraging these components provides a balanced approach – we gain accessible, keyboard-friendly behaviour with minimal additional code while maintaining consistency with the established design system.

Therefore, the implementation will:
1. Wrap the `Input` inside a `Popover` that toggles on focus/typing
2. Render suggestions using `CommandList` and `CommandItem` components
3. Reuse keyboard navigation and ARIA support provided by `cmdk`
4. Extend styling via utility classes to meet visual requirements

> This replaces the previous choice of a fully custom implementation while still retaining custom hooks (`useAddressAutocomplete`, `useCache`, `useRateLimit`) for data and state management.

## 📊 Technical Constraints and Considerations

### API Integration Constraints

**Rate Limiting Strategy**
- Implement 1-request-per-second throttling using a request queue
- Use exponential backoff for failed requests
- Cancel pending requests when new input is provided

**Caching Implementation**
- Use Map-based in-memory cache with LRU eviction
- Cache key: normalized search query
- Cache TTL: 5 minutes for search results
- Maximum cache size: 100 entries

**Geographic Prioritization**
- Calculate distance from current map center to suggestion coordinates
- Use haversine formula for distance calculation
- Sort suggestions by distance (ascending) with relevance score as tiebreaker

### Performance Considerations

**Debouncing Strategy**
- 300ms debounce for API requests
- Immediate UI updates for input changes
- Cancel previous debounced calls on new input

**Memory Management**
- Cleanup event listeners on component unmount
- Cancel pending API requests on unmount
- Clear cache on city/map context changes

### Accessibility Implementation

**ARIA Compliance**
- `role="combobox"` on input field
- `aria-expanded` to indicate dropdown state
- `aria-activedescendant` for keyboard navigation
- `role="listbox"` and `role="option"` for suggestions

**Keyboard Navigation**
- Arrow Up/Down: Navigate suggestions
- Enter: Select highlighted suggestion
- Escape: Close dropdown
- Tab: Move to next form element

## 🔧 Technical Implementation Details

### State Management Structure

```typescript
interface AutocompleteState {
  suggestions: AutocompleteResult[];
  isLoadingSuggestions: boolean;
  selectedSuggestionIndex: number;
  showSuggestions: boolean;
  error: string | null;
  cache: Map<string, CachedResult>;
  lastRequestTime: number;
}

interface CachedResult {
  data: AutocompleteResult[];
  timestamp: number;
  mapCenter: [number, number];
}
```

### API Service Extension

```typescript
// New function in src/features/map/api/index.ts
export async function fetchAddressSuggestions(
  query: string,
  mapCenter?: [number, number],
  limit = 6
): Promise<AutocompleteResult[]>
```

### Hook Architecture

```typescript
// useAddressAutocomplete hook signature
export function useAddressAutocomplete({
  onSelect: (result: AutocompleteResult) => void,
  mapCenter?: [number, number],
  minQueryLength = 3,
  debounceMs = 300,
})
```

### Error Handling Strategy

1. **API Failure**: Check cache for similar queries
2. **Cache Miss**: Show graceful degradation message
3. **Network Error**: Display offline-friendly message
4. **Rate Limit**: Queue request for later execution

### Integration Points

**SelectPoint Component Changes**
- Add autocomplete dropdown container
- Integrate keyboard event handlers
- Manage focus states between input and suggestions

**Existing Hook Integration**
- Extend `useEventHandlers` to include autocomplete events
- Maintain compatibility with existing map click and clear functionality
- Preserve touch event handling for mobile

## ✅ Resolved Design Decisions

### Geographic Prioritization (REQ-13)
- **Map Context Access**: Integrate with existing `useCityMap` hook to access current map center coordinates
- **Distance Calculation**: Use haversine formula to sort suggestions by proximity to map center
- **Cache Invalidation**: Clear cache when city context changes or map bounds shift significantly

### Platform Consistency (REQ-14)
- **Mobile UX**: Implement identical dropdown behavior across desktop and mobile platforms
- **Touch Handling**: Use existing touch event patterns from current codebase

### Error Handling (REQ-15)
- **Fallback Strategy**: Cached results → graceful degradation message → manual input remains available
- **Network Resilience**: Implement offline-friendly error messages and fallback states

## 📝 Resolved Technical Issues (Post-Review)

1. **Suggestion Deduplication** (Answered)
   - Rule: If two suggestions have *identical* `displayName` **and** identical coordinates, keep only one instance; otherwise retain both entries.
   - Implementation: After fetching suggestions, run a `Map`/`Set` based filter keyed by `${displayName}-${lat}-${lng}`.

2. **Bundle Size Impact** (Answered)
   - Decision: No immediate action required; bundle size is not a constraint for this feature iteration.

3. **Testing Strategy – Mocking Debounced API & Cache** (Answered)
   - **Unit Tests** (`vitest`):
     - Use `vi.useFakeTimers()` to control debounce timing.
     - Mock network requests with `vi.mock("@/features/map/api", () => ({ fetchAddressSuggestions: vi.fn() }))`.
     - Advance timers (`vi.advanceTimersByTime(300)`) to assert that the debounced function fires only once per input change.
   - **Integration Tests** (Playwright):
     - Employ **MSW (Mock Service Worker)** to intercept fetch calls during test runs; return deterministic suggestion lists and validate dropdown rendering/caching behaviour.
     - Alternatively, use Playwright's `page.route()` to stub network responses on a per-test basis.
     - Verify caching by typing the same query twice and ensuring the mocked API handler is hit only on the first invocation.

4. **Performance Monitoring** (Deferred)
   - TODO: Add performance instrumentation hooks in a future iteration once an agreed monitoring solution is selected (e.g., Web Vitals, custom logging, or APM tooling).

## 🎯 Implementation Priority

### Phase 1: Core Functionality
- Basic autocomplete with debouncing
- Simple suggestion dropdown
- Keyboard navigation
- API integration

### Phase 2: Performance Optimization
- Client-side caching
- Rate limiting
- Geographic prioritization

### Phase 3: Polish & Accessibility
- ARIA compliance
- Error handling refinement
- Mobile optimization
- Loading states improvement 