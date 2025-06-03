# [CheckRoute Map FlyTo] Requirements Definition Document

## 📋 Overview

Enhance the CheckRoute feature's user experience by automatically flying the map to center on a newly selected point (start or end), if and only if no other point is currently set. This provides immediate visual feedback when a user begins defining a route from a clear state.

## 🎯 Requirements

- R1: When a point (start or end) is selected, and no other point (end or start, respectively) is currently set, the map should automatically fly to center the newly selected point in the viewport. This applies to the initial point selection and any point selection made after both start and end points have been cleared.
- R2: The flyTo behavior should be triggered by both supported selection methods: entering an address (geocoding) or clicking directly on the map.
- R3: The flyTo animation should use the existing `flyTo` method from the `useCityMap` hook with its predefined zoom level and animation settings.
- R4: If a second point is selected immediately after the first point (triggering the flyTo), the flyTo animation for the first point should continue uninterrupted.
- R5: Even if the selected point is already visible within the current viewport, the map should still center on that point when the flyTo is triggered.
- R6: Failed geocoding or invalid map coordinates should be handled by existing error handling mechanisms; the flyTo logic itself should not trigger for invalid points.
- R7: The flyTo behavior should *not* occur if a point is selected or modified when the other point is already set.

## 📝 Functional Specifications

### Screen/Component Configuration

- The existing CheckRoute component will be enhanced to implement the specified flyTo logic.
- No new UI elements are required for this feature.
- The `useCityMap` hook's `flyTo` method will be utilized for the map animation.

### Behavior

- B1: **FlyTo Trigger Condition**: The system will trigger the flyTo action when a user selects either a starting point or an ending point, provided that the other respective point (ending or starting) is currently not set (i.e., is null or invalid).
- B2: **Address Entry Trigger**: When a user enters an address in either the start or end input field and it successfully geocodes to coordinates, if the condition in B1 is met, the map will fly to center on those coordinates.
- B3: **Map Click Trigger**: When a user clicks directly on the map to select a point, if the condition in B1 is met, the map will fly to center on the clicked coordinates.
- B4: **Centering Behavior**: The flyTo animation will center the selected point in the viewport regardless of whether the point was already visible or not.
- B5: **Animation Continuity**: If the user quickly selects a second point (thus making the condition in B1 false for future selections until points are cleared again) while the flyTo animation for the first point is still in progress, the first point's flyTo animation will continue to completion.
- B6: **Re-triggering After Clear**: If both the starting and ending points are cleared by the user, the flyTo behavior is re-enabled. The next selection of either a starting or ending point (while the other remains unset) will trigger the flyTo action again, as per B1.

### Constraints

- C1: The feature must use the existing `flyTo` method from `useCityMap` hook without modifications to its animation parameters or zoom settings.
- C2: The implementation should not interfere with existing map interactions or other CheckRoute functionality.
- C3: Error handling for failed geocoding or invalid coordinates should rely on existing error handling mechanisms.
- C4: The flyTo behavior should *only* trigger under the specific conditions outlined in B1 (i.e., when a single point is set from a state where no other point was active).

## 📊 Data Requirements

- DR1: Current state of both `startingPoint` and `endingPoint` to evaluate the trigger condition (i.e., is one point being set while the other is null/invalid?).
- DR2: Access to the `flyTo` method from the `useCityMap` hook.
- DR3: Coordinates of the selected point (from either geocoding results or map click events).
- DR4: (Implicit in DR1) No separate explicit state is needed to track if flyTo "has occurred"; the condition is checked on each relevant point change based on the current state of both points.

## 🔄 Interactions

- I1: **Geocoding Service**: When an address is entered and successfully geocoded, the resulting coordinates will be used for the flyTo behavior if the trigger conditions (B1) are met.
- I2: **Map Click Handler**: Map click events that result in point selection will use the clicked coordinates for the flyTo behavior if trigger conditions (B1) are met.
- I3: **Point State Management**: The flyTo logic will react to changes in the `startingPoint` and `endingPoint` states (likely Jotai atoms).
- I4: **useCityMap Hook**: Direct integration with the `flyTo` method provided by the `useCityMap` hook.

## ❓ Resolved Questions

1.  **FlyTo Trigger Condition / Reset**: When is the flyTo action triggered?
    *   **Answer**: The flyTo action is triggered when a user selects either a starting point or an ending point, provided that the other respective point (ending or starting) is currently not set. This state naturally resets if both points are subsequently cleared. The component's mount/unmount cycle also effectively resets this, as the points would be initially unset on a fresh mount.

2.  **Animation Interruption**: If the user performs other map interactions (pan, zoom) during the flyTo animation, should the animation continue or be interrupted?
    *   **Answer**: The flyTo animation should continue even if the user performs other map interactions (pan, zoom) during the animation. The map's view will ultimately settle on the centered first point once the flyTo animation completes.

3.  **Visual Feedback**: Should there be any additional visual indication that the flyTo behavior has been triggered, or is the map animation itself sufficient feedback?
    *   **Answer**: No additional visual feedback is needed beyond the map animation itself. The flyTo animation is considered sufficient to indicate that the map is centering on the selected point.