# [CheckRoute Map FlyTo] Task List

## 📋 Overview

This document outlines the development tasks for implementing the "flyTo" map behavior in the `CheckRoute` feature. The map will automatically center on a newly selected start or end point if, and only if, the other point is not currently set. This task list is based on the requirements in `requirements.md` and the design policy in `design.md`, which emphasizes handling side effects within event handlers.

## ✅ Task List

### Phase 1: Core Logic and Helper Function

1.  **[Task 1] Define Helper Function `executeConditionalFlyTo`**
    -   Overview: Create a reusable helper function within `CheckRoute.tsx` (or an appropriate utility scope) that encapsulates the logic to check conditions and trigger the map's `flyTo` action.
    -   Completion Criteria:
        -   [ ] Function signature defined: `executeConditionalFlyTo(pointJustSet: Point | null, otherPoint: Point | null, mapInstance: MapGL)`.
        -   [ ] Function body correctly checks if `mapInstance` is valid, `pointJustSet` has coordinates, and `otherPoint` is null/invalid.
        -   [ ] If conditions are met, `mapInstance.flyTo({ center: pointJustSet.coordinates, ... })` is called (using default zoom/animation from `useCityMap`).
        -   [ ] Unit tests for `executeConditionalFlyTo` written using Vitest, covering:
            -   [ ] `flyTo` is called when conditions are met for `startingPoint`.
            -   [ ] `flyTo` is called when conditions are met for `endingPoint`.
            -   [ ] `flyTo` is NOT called if `pointJustSet` is null.
            -   [ ] `flyTo` is NOT called if `otherPoint` is set.
            -   [ ] `flyTo` is NOT called if `mapInstance` is null.
    -   Operational Confirmation:
        -   [ ] `npm run test` passes (all tests for `executeConditionalFlyTo` are green).
        -   [ ] `npm run check:biome` reports no errors.
        -   [ ] `npm run typecheck` reports no type errors.
    -   Notes: This function will be called by various event handlers. `Point` and `MapGL` types should match project definitions.

### Phase 2: Integration with Point Selection Handlers

2.  **[Task 2] Integrate `executeConditionalFlyTo` into Starting Point Geocode Handler**
    -   Overview: Modify the callback/handler that processes a successful geocode result for the starting point.
    -   Completion Criteria:
        -   [ ] After the `startingPointAtom` is updated with the `newStartingPoint`.
        -   [ ] The current state of `endingPointAtom` is retrieved.
        -   [ ] `executeConditionalFlyTo(newStartingPoint, currentEndingPoint, map)` is called.
        -   [ ] Consider mocking Jotai atoms and `useCityMap` for focused testing of this integration point if direct unit testing is complex.
    -   Operational Confirmation:
        -   [ ] `npm run test` (relevant integration tests or updated unit tests for the handler).
        -   [ ] `npm run check:biome` reports no errors.
        -   [ ] `npm run typecheck` reports no type errors.
        -   [ ] Manual Confirmation:
            -   Clear both points.
            -   Enter an address for the start point.
            -   Verify map flies to the start point.
            -   Set an end point.
            -   Change the start point address.
            -   Verify map does NOT fly to the new start point.

3.  **[Task 3] Integrate `executeConditionalFlyTo` into Ending Point Geocode Handler**
    -   Overview: Modify the callback/handler that processes a successful geocode result for the ending point.
    -   Completion Criteria:
        -   [ ] After the `endingPointAtom` is updated with the `newEndingPoint`.
        -   [ ] The current state of `startingPointAtom` is retrieved.
        -   [ ] `executeConditionalFlyTo(newEndingPoint, currentStartingPoint, map)` is called.
    -   Operational Confirmation:
        -   [ ] `npm run test` (relevant integration tests or updated unit tests for the handler).
        -   [ ] `npm run check:biome` reports no errors.
        -   [ ] `npm run typecheck` reports no type errors.
        -   [ ] Manual Confirmation:
            -   Clear both points.
            -   Enter an address for the end point.
            -   Verify map flies to the end point.
            -   Set a start point.
            -   Change the end point address.
            -   Verify map does NOT fly to the new end point.

4.  **[Task 4] Integrate `executeConditionalFlyTo` into Starting Point Map Click Handler**
    -   Overview: Modify the handler for map clicks that set the starting point.
    -   Completion Criteria:
        -   [ ] After the `startingPointAtom` is updated with the `newStartingPoint` (from map click coordinates).
        -   [ ] The current state of `endingPointAtom` is retrieved.
        -   [ ] `executeConditionalFlyTo(newStartingPoint, currentEndingPoint, map)` is called.
    -   Operational Confirmation:
        -   [ ] `npm run test` (relevant integration tests or updated unit tests for the handler).
        -   [ ] `npm run check:biome` reports no errors.
        -   [ ] `npm run typecheck` reports no type errors.
        -   [ ] Manual Confirmation:
            -   Clear both points.
            -   Click map to set the start point.
            -   Verify map flies to the start point.
            -   Set an end point.
            -   Click map to change the start point.
            -   Verify map does NOT fly to the new start point.

5.  **[Task 5] Integrate `executeConditionalFlyTo` into Ending Point Map Click Handler**
    -   Overview: Modify the handler for map clicks that set the ending point.
    -   Completion Criteria:
        -   [ ] After the `endingPointAtom` is updated with the `newEndingPoint` (from map click coordinates).
        -   [ ] The current state of `startingPointAtom` is retrieved.
        -   [ ] `executeConditionalFlyTo(newEndingPoint, currentStartingPoint, map)` is called.
    -   Operational Confirmation:
        -   [ ] `npm run test` (relevant integration tests or updated unit tests for the handler).
        -   [ ] `npm run check:biome` reports no errors.
        -   [ ] `npm run typecheck` reports no type errors.
        -   [ ] Manual Confirmation:
            -   Clear both points.
            -   Click map to set the end point.
            -   Verify map flies to the end point.
            -   Set a start point.
            -   Click map to change the end point.
            -   Verify map does NOT fly to the new end point.

### Phase 3: Testing and Refinement

6.  **[Task 6] Comprehensive Manual Testing of All Scenarios**
    -   Overview: Perform thorough end-to-end testing covering various interaction sequences.
    -   Completion Criteria:
        -   [ ] Scenario: Clear both points -> Set Start Point (Geocode) -> Map flies.
        -   [ ] Scenario: Clear both points -> Set Start Point (Map Click) -> Map flies.
        -   [ ] Scenario: Clear both points -> Set End Point (Geocode) -> Map flies.
        -   [ ] Scenario: Clear both points -> Set End Point (Map Click) -> Map flies.
        -   [ ] Scenario: Start set -> Set End Point -> Map does NOT fly for end point.
        -   [ ] Scenario: End set -> Set Start Point -> Map does NOT fly for start point.
        -   [ ] Scenario: Both points set -> Clear Start -> Set new Start -> Map does NOT fly.
        -   [ ] Scenario: Both points set -> Clear End -> Set new End -> Map does NOT fly.
        -   [ ] Scenario: Both points set -> Clear Both -> Set Start -> Map flies.
        -   [ ] Scenario: Both points set -> Clear Both -> Set End -> Map flies.
        -   [ ] Test interaction with map (pan/zoom) during flyTo - animation should complete.
        -   [ ] Test with point already visible in viewport - map should still center.
    -   Operational Confirmation:
        -   [ ] `npm run test` passes.
        -   [ ] `npm run check:biome` reports no errors.
        -   [ ] `npm run typecheck` reports no type errors.
        -   [ ] All manual test scenarios above pass as expected.

7.  **[Task 7] Code Review and Refinement**
    -   Overview: Review the implemented solution for clarity, efficiency, and adherence to design and project standards.
    -   Completion Criteria:
        -   [ ] Code related to the flyTo logic is reviewed by another team member.
        -   [ ] Naming conventions are consistent.
        -   [ ] Helper function `executeConditionalFlyTo` is well-utilized.
        -   [ ] No unnecessary complexity or redundant code.
    -   Operational Confirmation:
        -   [ ] `npm run check:biome` reports no errors.
        -   [ ] `npm run typecheck` reports no type errors.

## ❓ Unresolved Issues/Confirmation Items

-   None anticipated at this stage. The design focuses on direct event handler logic.

## 🔗 Related Documents

-   Implementation Requirements: [./requirements.md](./requirements.md)
-   Design Policy: [./design.md](./design.md)