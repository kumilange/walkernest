# [RouteLayer Animation] Task List

## 📋 Overview

This document outlines the development tasks for implementing the route drawing animation on the `RouteLayer` component. The animation will feature a dashed line progressively filling in over a fixed 1000ms duration. The `RouteLayer` component will be re-mounted (via a changing `key` prop) when a new distinct route is to be animated, simplifying its internal animation lifecycle.

## ✅ Task List

### Phase 1: Core Animation Logic & State Setup (per `RouteLayer` instance)

1.  **Define `RouteLayer` Props and Keying Strategy**
    -   Overview: Specify that `RouteLayer` will accept a `route` prop and expect a `key` prop from its parent that changes when a new animation cycle should begin for a new route.
    -   Completion Criteria:
        -   [ ] `RouteLayer` props interface defined (e.g., `interface RouteLayerProps { route: Route | null; }`).
        -   [ ] Documentation/notes in `useCheckRoutes` (or parent component logic) to generate a stable `routeId` (e.g., from start/end point coordinates) to be used as `RouteLayer`'s `key`. Example: `<RouteLayer key={routeId} route={route} />`.
    -   Operational Confirmation:
        -   [ ] `npm run typecheck` reports no errors.
        -   [ ] `npm run check:biome` reports no lint errors.
    -   Notes: This task sets the stage for the key-based re-mounting strategy.

2.  **Setup Local State for Animation in `RouteLayer.tsx`**
    -   Overview: Initialize React state variables within `RouteLayer` for a single animation run (per mount).
    -   Completion Criteria:
        -   [ ] State variable `animatedCoordinates: LngLatLike[]` is defined.
        -   [ ] Ref `animationStartTimeRef: React.MutableRefObject<number | null>` is defined (using a ref for start time as it doesn't need to trigger re-renders itself).
        -   [ ] Ref `rafIdRef: React.MutableRefObject<number | null>` is defined.
    -   Operational Confirmation:
        -   [ ] `npm run typecheck` reports no type errors.
        -   [ ] `npm run check:biome` reports no lint errors.

3.  **Implement `requestAnimationFrame` Loop for a Single Animation Cycle**
    -   Overview: Create the animation loop that runs once per component mount, updating for 1000ms.
    -   Completion Criteria:
        -   [ ] A function (e.g., `animateStep`) is created.
        -   [ ] Inside `animateStep`, calculate `elapsedTime = Date.now() - animationStartTimeRef.current`.
        -   [ ] If `elapsedTime < 1000`, schedule the next frame: `rafIdRef.current = requestAnimationFrame(animateStep)`.
        -   [ ] If `elapsedTime >= 1000`, animation stops, and route is set to full (logic for full draw in a later task).
    -   Operational Confirmation:
        -   [ ] `npm run typecheck` reports no errors.
        -   [ ] `npm run check:biome` reports no lint errors.

4.  **Implement Coordinate Array Slicing Logic**
    -   Overview: Develop the function to calculate the subset of route coordinates based on animation progress.
    -   Completion Criteria:
        -   [ ] A helper function (e.g., `getAnimatedSlice(progress: number, originalCoordinates: LngLatLike[]): LngLatLike[]`) is created.
        -   [ ] `progress` is 0.0 to 1.0.
        -   [ ] Logic correctly slices `originalCoordinates` based on `progress` and array length, ensuring at least 2 points for a line segment if `progress > 0` and `originalCoordinates.length >= 2`.
        -   [ ] The `setAnimatedCoordinates` state updater is called with the result within `animateStep`.
    -   Operational Confirmation:
        -   [ ] Unit tests for `getAnimatedSlice` cover various scenarios.
        -   [ ] `npm run test` passes these tests.
        -   [ ] `npm run typecheck` reports no errors.
        -   [ ] `npm run check:biome` reports no lint errors.

5.  **Render Animated Route using Sliced Coordinates**
    -   Overview: Update the MapLibre `Source` to use `animatedCoordinates`.
    -   Completion Criteria:
        -   [ ] `Source` data prop is a GeoJSON `LineString` from `animatedCoordinates`.
        -   [ ] `Layer` uses specified paint properties (`line-width: 5`, `line-dasharray: [0, 1]`, etc.).
    -   Operational Confirmation:
        -   [ ] `npm run typecheck` reports no errors.
        -   [ ] `npm run check:biome` reports no lint errors.
        -   [ ] Manual Confirmation: Temporarily mount `RouteLayer` with mock route data to see a single animation run.

### Phase 2: Animation Lifecycle (Mount/Unmount) & Route Integration

6.  **Initiate Animation on Mount and Cleanup on Unmount using `useEffect`**
    -   Overview: Use a single `useEffect` hook with an empty dependency array `[]` to manage the animation lifecycle for the mounted component instance.
    -   Completion Criteria:
        -   [ ] `useEffect(() => { ... return () => { ... } }, []);` is implemented.
        -   [ ] **On Mount (effect body)**:
            -   Check if `props.route` and `props.route.geometry.coordinates` are valid (>= 2 points).
            -   If valid, set `animationStartTimeRef.current = Date.now()`.
            -   Initialize `animatedCoordinates` (e.g., to the first two points or an empty array to start drawing).
            -   Start the `animateStep` loop: `rafIdRef.current = requestAnimationFrame(animateStep)`.
            -   If not valid, `animatedCoordinates` is set to empty or single point.
        -   [ ] **On Unmount (cleanup function)**:
            -   If `rafIdRef.current` is not null, cancel it: `cancelAnimationFrame(rafIdRef.current)`.
    -   Operational Confirmation:
        -   [ ] `npm run typecheck` reports no type errors.
        -   [ ] `npm run check:biome` reports no lint errors.
        -   [ ] Manual Confirmation: Test by mounting/unmounting `RouteLayer` (e.g., by changing its `key` in a test setup) and observe animation starting on mount and stopping on unmount.

7.  **Ensure Full Route Display on Animation Completion**
    -   Overview: When 1000ms is complete, `animatedCoordinates` is set to full original route coordinates.
    -   Completion Criteria:
        -   [ ] In `animateStep`, when `elapsedTime >= 1000`, `setAnimatedCoordinates(props.route.geometry.coordinates)`.
        -   [ ] `rafIdRef.current` is set to `null`.
    -   Operational Confirmation:
        -   [ ] `npm run typecheck` reports no type errors.
        -   [ ] `npm run check:biome` reports no lint errors.
        -   [ ] Manual Confirmation: Observe route is fully drawn after 1000ms.

### Phase 3: Integration with `useCheckRoutes` and Parent Component

8.  **Integrate Key-Based Re-mounting with `useCheckRoutes`**
    -   Overview: Ensure `useCheckRoutes` (or the component consuming it) provides a stable `routeId` that changes appropriately to trigger `RouteLayer` re-mounts.
    -   Completion Criteria:
        -   [✅] `useCheckRoutes` is modified to return a `routeId`. This `routeId` will be based on `routeFetchRef.current` (or a state variable updated with it when a new route fetch is initiated via `fetchRouteWithSafeguards`).
        -   [✅] The parent component rendering `RouteLayer` uses this `routeId` as its `key` prop.
        -   [✅] When `useCheckRoutes` establishes a new distinct route (e.g., after geocoding, reversing points), the `routeId` changes, triggering a re-mount of `RouteLayer`.
    -   Operational Confirmation:
        -   [✅] `npm run typecheck` reports no type errors.
        -   [✅] `npm run check:biome` reports no lint errors.
        -   [ ] Manual Confirmation: Test by changing the route via UI (select points, reverse) and verify `RouteLayer` re-animates due to key change.

9.  **Handle Edge Cases for Route Coordinates (within `RouteLayer`'s mount effect)**
    -   Overview: Graceful handling for routes with fewer than 2 coordinates.
    -   Completion Criteria:
        -   [✅] `RouteLayer`'s mount `useEffect` checks `props.route.geometry.coordinates`.
        -   [✅] If fewer than 2 points, no animation starts, `animatedCoordinates` is set appropriately (e.g., empty or single point), no error.
    -   Operational Confirmation:
        -   [✅] `npm run typecheck` reports no type errors.
        -   [✅] `npm run check:biome` reports no lint errors.
        -   [ ] Manual Confirmation: Test with routes having 0 or 1 point.

10. **Implement Map Fitting Pre-Animation (Coordination with `useCheckRoutes`)**
    -   Overview: Confirm `fitBounds` is called before the new `RouteLayer` instance (with its new key) mounts and starts its animation.
    -   Completion Criteria:
        -   [✅] `useCheckRoutes` should ensure `fitBounds` is called when a new route is established. The state updates that provide the new `route` and `routeId` to the parent should ideally occur after `fitBounds` has been processed or in a way that the map is already adjusted when `RouteLayer` mounts.
    -   Operational Confirmation:
        -   [✅] `npm run typecheck` reports no type errors.
        -   [✅] `npm run check:biome` reports no lint errors.
        -   [ ] Manual Confirmation: Map adjusts, then new animation plays.

11. **Verify Background Tab Completion**
    -   Overview: Confirm `requestAnimationFrame` behavior allows animation completion if tab is inactive.
    -   Completion Criteria:
        -   [✅] The animation state (full coordinates) is set after 1000ms of *calculated* elapsed time, irrespective of tab rendering activity.
    -   Operational Confirmation:
        -   [ ] Manual Confirmation: Start animation, switch tab for >1s, switch back. Route should be fully drawn.

### Phase 4: Testing & Documentation (Adjusted for Key-based re-rendering)

12. **Write Unit Tests for Animation Helpers**
    -   Overview: Robust unit tests for `getAnimatedSlice`.
    -   Completion Criteria:
        -   [✅] (Same as before) Vitest tests for `getAnimatedSlice`.
        -   [✅] `npm run test` passes.
    -   Operational Confirmation:
        -   [✅] All tests pass.

13. **Write/Update Integration/Component Tests for `RouteLayer`**
    -   Overview: Test `RouteLayer`'s single animation cycle. Testing key-based re-mounts might involve rendering the parent with different keys.
    -   Completion Criteria:
        -   [✅] Test `RouteLayer` with a valid `route` prop:
            -   Mock `requestAnimationFrame` and timers (`jest.useFakeTimers()` or Vitest equivalent).
            -   Verify `animatedCoordinates` state updates correctly over the mocked 1000ms.
            -   Verify cleanup function cancels RAF.
        -   [✅] Test graceful handling of invalid/short routes on mount.
    -   Operational Confirmation:
        -   [✅] All tests pass with `npm run test`.

14. **Final Manual Testing & QA**
    -   Overview: Thorough manual testing.
    -   Completion Criteria:
        -   [ ] (Same scenarios as before) Test short/long routes, rapid changes, geocoding, clearing points.
        -   [ ] Confirm visual appearance.
    -   Operational Confirmation:
        -   [✅] `npm run test` passes.
        -   [✅] `npm run check:biome` reports no errors.
        -   [✅] `npm run typecheck` reports no type errors.
        -   [ ] Feature behaves as expected.

## ❓ Unresolved Issues/Confirmation Items

-   The implementation detail for `useCheckRoutes` to **expose a stable `routeId`** (based on `routeFetchRef.current` or a state variable updated with it) needs to be implemented as planned. This `routeId` will then be used as the `key` for the `<RouteLayer />` component by its parent, driving the re-mount and re-animation. *(This item is now an action item for Task 8)*.

## 🔗 Related Documents

-   Implementation Requirements: [./specification.md](./specification.md)
-   Design Policy: [./design.md](./design.md)