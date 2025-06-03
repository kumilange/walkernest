# [RouteLayer Animation] Requirements Definition Document

## 📋 Overview

To enhance the user experience by visually animating the drawing of a route on the `RouteLayer`. This will make route discovery more dynamic, engaging, and provide a clearer indication of the route's path progression.

## 🎯 Requirements

- R1: The route path should be animated as if it's being drawn progressively on the map from the starting point to the ending point, appearing as a dashed line progressively filling in. The animation for any route should complete within a constant duration of 1000ms.
- R2: The animation must be smooth and visually appealing without flickering or stuttering.
- R3: The animation process should not significantly degrade map performance or responsiveness.
- R4: It should be clear to the user when a route animation is in progress (via the drawing motion) and when it has completed.
- R5: The system should gracefully handle route updates (e.g., reversing points, selecting new points) during an ongoing animation by stopping the current animation and starting a new one for the updated route.
- R6: Basic map interactions (zoom, pan) should remain functional during the route animation.
- R7: The initial display of a route should also be animated with the same 1000ms duration.
- R8: (Implicitly handled by constant duration) Very short routes will complete their animation within 1000ms.
- R9: If the browser tab becomes inactive during an animation, the animation should complete in the background.

## 📝 Functional Specifications

### Screen/Component Configuration

- The existing `RouteLayer` component will be modified to incorporate the animation logic.
- The visual representation of the route line will be a dashed line that updates frame-by-frame to create the "filling in" drawing effect.
- No new UI controls for the animation are required.

### Behavior

- B1: When a new route is fetched and available, or when an initial route is present, the `RouteLayer` will initiate an animation to draw the route path.
- B2: The animation will visually depict a dashed line progressively "filling in" along the route's path, starting from the starting coordinate and moving towards the ending coordinate.
- B3: The total animation duration for drawing any route will be a constant **1000ms**, regardless of the route's actual length.
- B4: If the route is changed (e.g., points reversed, a new address geocoded for start/end) while an animation is in progress, the current animation will stop immediately. A new animation (1000ms duration) will then commence for the updated route.
- B5: The map view will be pre-set to fit the entire route *before* the animation begins and will remain static during the animation. Users can still manually pan/zoom.
- B6: If route calculation fails or results in no valid geometry, an appropriate error message (e.g., "Route calculation failed") will be displayed as per standard error Handlung; the animation system will not attempt to animate an invalid or non-existent route.
- B7: If the browser tab becomes inactive during an animation, the animation will continue to process and complete in the background. When the tab is reactivated, if the 1000ms has elapsed, the route will appear fully drawn.

### Constraints

- C1: Animation techniques should be chosen carefully to ensure optimal performance (e.g., leveraging `requestAnimationFrame` or map library-specific animation features) and to ensure the "dashed line filling in" effect is visually coherent within the fixed 1000ms timeframe for routes of varying lengths.
- C2: The animation should be efficient in terms of resource consumption (CPU, memory).
- C3: The solution must be compatible with the existing MapLibre GL map rendering.
- C4: The animation should be designed to be interruptible or reset cleanly if the underlying route data changes.

## 📊 Data Requirements

- DR1: The ordered list of coordinates (geometry) for the route path.
- DR2: State variables to manage animation progress (e.g., current animation time, percentage of route drawn).
- DR3: Configuration parameter for animation: fixed duration (1000ms).

## 🔄 Interactions

- I1: **Route Data Fetching**: Animation will commence once new route data is successfully fetched/processed or an initial route is available.
- I2: **Map Controls**: Users can pan and zoom the map while the animation is occurring. The animation itself does not alter the map viewport after its initial setup.
- I3: **Point Selection/Modification**: If `startingPoint` or `endingPoint` are modified or cleared while an animation is in progress, the current animation stops, and a new 1000ms animation begins for the resulting route (if valid).
- I4: **Route Reversal**: If points are reversed during an animation, the current animation stops, and a new 1000ms animation begins for the reversed route.

## ❓ Unresolved Questions

1.  **Visual Cohesion for Varying Lengths**:
    *   With a fixed 1000ms duration, how should the "dashed line progressively filling in" effect be managed to ensure it looks good for both very short routes (where it might appear slow or too detailed) and very long routes (where it might appear extremely fast, potentially losing the "dashed" detail and just looking like a solid line appearing quickly)?
    *   Are there minimum/maximum segments or dash lengths to consider to maintain visual quality across different route lengths animated over the same 1000ms? Or is the expectation that the visual speed of the "filling" will naturally vary?
