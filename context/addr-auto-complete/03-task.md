# Address Autocomplete Feature Task List

## 📋 Overview

This task list breaks down the implementation of the **Address Autocomplete** feature for route planning. It follows the specifications in:

- `01-requirements.md` (Address Autocomplete Requirements)
- `02-design.md` (Autocomplete Design Policy)

The objective is to deliver an accessible, performant autocomplete dropdown integrated with the existing `SelectPoint` component, leveraging *shadcn/ui* `Command` primitives and custom hooks for data handling.

---

> **Quality Gate for Every Task**  
> *Regardless of phase, each task must conclude with:*  
> • All unit/integration tests passing (`npm run test`)  
> • Zero lint errors (`npm run check:biome`)  
> • Zero type errors (`npm run typecheck`)  
> If a task's _Operational Confirmation_ list omits these, they are **implicitly required**.

## ✅ Task List

### Phase 1 – Core UI & Hook Skeleton (REQ-1 → REQ-10)

1. **Task 1.1 – `fetchAddressSuggestions` API service**
   - **Overview**: Add new function to `frontend/src/features/map/api/index.ts` that queries Nominatim and returns a typed `AutocompleteResult[]`.
   - **Completion Criteria**:
     - [ ] Unit tests cover success, empty result, network failure.
     - [ ] Function respects `limit` param (default 6).
     - [ ] Lints & type-checks pass.
   - **Operational Confirmation**:
     - [ ] `npm run test` green.
     - [ ] `npm run check:biome` zero issues.
     - [ ] `npm run typecheck` zero issues.

2. **Task 1.2 – `useAddressAutocomplete` hook skeleton**
   - **Overview**: Create a hook returning `{ suggestions, isLoading, selectedIdx, handleInput, handleSelect }` but with hard-coded mock data for now.
   - **Completion Criteria**:
     - [ ] Hook compiles & returns default empty state.
     - [ ] Unit test verifies debounce with `vi.useFakeTimers()`.
   - **Operational Confirmation**: same as above.

3. **Task 1.3 – `AddressSuggestions` dropdown component**
   - **Overview**: Build dropdown using *shadcn/ui* `Popover` + `CommandList`/`CommandItem` with keyboard navigation & loading/empty states.
   - **Completion Criteria**:
     - [ ] Snapshot test verifies render of 3 states: loading, empty, list.
     - [ ] ARIA roles inherit from `cmdk`.
   - **Operational Confirmation**: tests + Storybook visual (manual).

4. **Task 1.4 – Integrate dropdown into `SelectPoint`**
   - **Overview**: Replace plain `<Input>` with wrapped `Popover` showing suggestions; wire to mock hook.
   - **Completion Criteria**:
     - [ ] `SelectPoint` renders unchanged visually when no suggestions.
     - [ ] Keyboard nav selects item & triggers `onSelect` callback (unit test with RTL).
   - **Operational Confirmation**: manual check in browser.

### Phase 2 – Data, Caching & Performance (REQ-11 → REQ-13)

5. **Task 2.1 – Wire hook to real API + rate limiting**
   - **Overview**: Implement debounce (300 ms) + 1 req/sec throttle inside hook.
   - **Completion Criteria**:
     - [ ] Unit test ensures max 1 fetch/sec when typing quickly.
     - [ ] Requests cancelled on new query.

6. **Task 2.2 – Client-side cache (LRU)**
   - **Overview**: Add Map-based cache (size 100, TTL 5 min) to hook.
   - **Completion Criteria**:
     - [ ] Cache hit prevents network call (mock verified).
     - [ ] Cache invalidates after TTL or city change.

7. **Task 2.3 – Geographic prioritisation**
   - **Overview**: Sort results by distance from map centre using haversine util.
   - **Completion Criteria**:
     - [ ] Unit test supplies mock centre & asserts order.

### Phase 3 – UX Polish & Accessibility (REQ-14 → REQ-15)

8. **Task 3.1 – Error & fallback handling**
   - **Overview**: Implement cached-result fallback; show toast on failure.
   - **Completion Criteria**:
     - [ ] Integration test (Playwright+MSW) simulates network fail then success.

9. **Task 3.2 – Accessibility & focus management**
   - **Overview**: Ensure `role="combobox"`, correct `aria-expanded`, focus returns to input after selection.
   - **Completion Criteria**:
     - [ ] RTL axe accessibility test passes.

10. **Task 3.3 – Touch/mobile validation**
    - **Overview**: Verify dropdown interactions on mobile viewport.
    - **Completion Criteria**:
      - [ ] Playwright test emulating iPhone selects suggestion successfully.

### Phase 4 – Documentation & Clean-up

11. **Task 4.1 – Update README / Storybook stories**
    - Provide usage docs and interactive stories for `SelectPoint` with autocomplete.

12. **Task 4.2 – Code cleanup & CI checks**
    - Ensure all scripts (`test`, `check:biome`, `typecheck`) pass in CI.

---

## ❓ Unresolved Issues/Confirmation Items

All previously noted issues are now resolved.

• **MSW confirmed**: We'll use Mock Service Worker (MSW) with Playwright for network interception in integration tests as outlined in Task 3.1.

No further confirmations required at this time.

## 🔗 Related Documents

- Requirements: [./01-requirements.md](mdc:01-requirements.md)
- Design Policy: [./02-design.md](mdc:02-design.md) 