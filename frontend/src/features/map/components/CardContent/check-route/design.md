# [CheckRoute Map FlyTo] Design Policy Document

## 📋 Overview

This document outlines the technical approach and design policy for implementing the map "flyTo" behavior in the CheckRoute feature. This behavior is triggered when a user selects a single point (start or end) and no other point is currently set. The aim is to provide immediate visual feedback by centering the map on this selection, as defined in `requirements.md`. This design prioritizes handling side effects in event handlers rather than `useEffect` where appropriate.

## 🔍 Requirements Analysis

Key implementation points extracted from `requirements.md`:

-   **Core Behavior**: When a point (start or end) is selected, and the other respective point (end or start) is currently not set (null/invalid), the map must automatically fly to and center on this newly selected point.
-   **Re-triggerable**: This behavior can occur multiple times. If both points are cleared, the next selection of a single point will again trigger `flyTo`.
-   **Trigger Conditions**: Triggered by successful geocoding or direct map click.
-   **Map Interaction**: Uses `flyTo` from `useCityMap` hook. Animation continues if a second point is selected. Centers even if visible. User interactions during flyTo do not interrupt it.
-   **State and Lifecycle**: Trigger condition is based purely on the current state of `startingPoint` and `endingPoint`.
-   **Error Handling**: Relies on existing mechanisms.
-   **Visuals**: No additional visual feedback needed.

## 🛠 Implementation Policy

### Architecture Choice

-   The primary logic for the `flyTo` behavior will be invoked from within the event handlers or callbacks responsible for setting the `startingPoint` and `endingPoint` (e.g., geocoding success callbacks, map click handlers).
-   A dedicated helper function, `executeConditionalFlyTo`, will be created within the `CheckRoute.tsx` component's scope (or a closely related module/hook if deemed cleaner) to encapsulate the logic for checking conditions and calling the map's `flyTo` method. This promotes DRY principles.

### Component Design (`CheckRoute.tsx` and related handlers)

-   **State Management**:
    -   `startingPoint` and `endingPoint` states (likely derived from Jotai atoms like `startingPointAtom` and `endingPointAtom`) will provide the current selected points.
-   **Helper Function (`executeConditionalFlyTo`)**:
    ```typescript
    // Conceptual placement within CheckRoute.tsx or an associated utility
    // const { map } = useCityMap(); // Assuming map is accessible

    const executeConditionalFlyTo = (
      pointJustSet: Point | null,      // The point that was just successfully set
      otherPoint: Point | null,        // The current state of the *other* point
      mapInstance: MapGL // Or the specific map type from useCityMap
    ) => {
      if (mapInstance && pointJustSet?.coordinates && !otherPoint) {
        mapInstance.flyTo({
          center: pointJustSet.coordinates,
          // zoom and other options are expected to be defaults within useCityMap's flyTo
        });
      }
    };
    ```
-   **Event Handlers / Callbacks** (Conceptual examples):
    -   **Handler for setting `startingPoint`** (e.g., after geocode success or map click):
        1.  Receives `newStartingPoint`.
        2.  Updates `startingPointAtom` with `newStartingPoint`.
        3.  Retrieves the current value of `endingPointAtom` (e.g., `const currentEndingPoint = getEndingPointAtom();`).
        4.  Calls `executeConditionalFlyTo(newStartingPoint, currentEndingPoint, map)`.
    -   **Handler for setting `endingPoint`**:
        1.  Receives `newEndingPoint`.
        2.  Updates `endingPointAtom` with `newEndingPoint`.
        3.  Retrieves the current value of `startingPointAtom` (e.g., `const currentStartingPoint = getStartingPointAtom();`).
        4.  Calls `executeConditionalFlyTo(newEndingPoint, currentStartingPoint, map)`.

### Data Flow

1.  A user action (address input leading to geocode success, or a map click) intending to set a point triggers a specific event handler/callback.
2.  Consider the flow for setting `startingPoint`:
    a.  The handler receives the `newStartingPoint` data.
    b.  It updates the global state for `startingPoint` (e.g., `setStartingPointAtom(newStartingPoint)`).
    c.  It then reads the current global state of `endingPoint` (e.g., `getEndingPointAtom()`).
    d.  It calls the `executeConditionalFlyTo` helper with `newStartingPoint`, the current `endingPoint` state, and the map instance.
3.  The `executeConditionalFlyTo` function checks if `newStartingPoint` is valid and `endingPoint` is not set. If true, it invokes `map.flyTo()` with `newStartingPoint.coordinates`.
4.  A symmetrical flow occurs when setting the `endingPoint`.
5.  This approach naturally handles re-triggering: if both points are cleared, the subsequent setting of a single point will find the "other point" as null, satisfying the condition.

## 🔄 Implementation Method Options and Decision

### Option 1: Side effects in Event Handlers with Helper Function (Preferred)

-   **Description**:
    -   The `flyTo` side effect is initiated directly from the event handlers (or their subsequent callbacks like geocode success) that update `startingPoint` or `endingPoint`.
    -   A helper function (`executeConditionalFlyTo`) centralizes the condition check (one point set, other is null) and the actual `map.flyTo()` call.
-   **Evaluation**:
    -   *Pros*:
        -   Directly couples the user's action of setting a point with the `flyTo` side effect.
        -   Avoids `useEffect` for this side effect, aligning with the preference for more imperative control in this case.
        -   The helper function mitigates code duplication across different point-setting handlers.
        -   Clearer "cause and effect" for developers reading the code.
    -   *Cons*:
        -   Event handlers become slightly more complex as they need to fetch the state of the "other" point and call the helper. However, this is a minor addition.
        -   Requires disciplined use of the helper function in all relevant point-setting pathways.

### Option 2: `useEffect` reacting to point states (Alternative)

-   **Description**:
    -   A `useEffect` hook in `CheckRoute.tsx` listens to changes in `startingPoint` and `endingPoint`.
    -   When changes are detected, the effect checks the condition (one point set, the other is null) and calls `map.flyTo()`.
-   **Evaluation**:
    -   *Pros*:
        -   Declarative: clearly expresses "when these states change, this logic runs."
        -   Centralizes the reaction logic in one place.
    -   *Cons*:
        -   Can sometimes obscure the exact trigger if dependencies or conditions are complex (though not significantly in this case).
        -   The user expressed a preference to explore alternatives to `useEffect` for this specific behavior.

### Decision: Option 1 - Side effects in Event Handlers with Helper Function

-   **Reason for Selection**:
    -   Aligns with the user's preference to tie the side effect more directly to the initiating user actions rather than a generalized state-watching effect.
    -   Provides a clear, imperative execution path for the `flyTo` behavior.
    -   The use of a helper function maintains code clarity and avoids redundancy.
-   **Expected Effects**:
    -   The map will reliably fly to a newly selected single point when the other point is clear.
    -   The implementation logic will be clear within the event handling pathways.
    -   The behavior correctly re-triggers after points are cleared and one is re-selected.

## 📊 Technical Constraints and Considerations

-   **`useCityMap` Hook**: Adherence to using the `flyTo` method provided by the `useCityMap` hook.
-   **Jotai State**: Handlers must correctly update their target Jotai atom and then reliably read the current state of the *other* relevant atom. Jotai's synchronous nature for atom reads (`get`) after a `set` within the same execution block should make this straightforward.
-   **Map Instance Availability**: Ensure the `map` instance from `useCityMap` is available to the `executeConditionalFlyTo` helper or passed to it.
-   **Asynchronous Operations**: For actions like geocoding, the call to `executeConditionalFlyTo` must occur in the success callback *after* the point's state has been updated.

## ❓ Technical Issues to Be Resolved

-   **Handler Consistency**: Ensure that all paths that set `startingPoint` or `endingPoint` (e.g., geocoding for start, map click for start, geocoding for end, map click for end) correctly call the `executeConditionalFlyTo` helper with the appropriate parameters.
    -   *Mitigation*: Clear documentation and code structure for point-setting functions will be important. The helper function itself simplifies what each handler needs to do.
-   **State Snapshotting for `otherPoint`**: Confirm that reading the "other" Jotai atom immediately after setting the first atom within the same synchronous block of an event handler reliably provides the correct "current" state of that other atom for the condition check. (This is generally true for Jotai's `get` functionality).
