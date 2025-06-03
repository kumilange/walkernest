# [RouteLayer Animation] Design Policy Document

## 📋 Overview

This document outlines the technical approach and design policy for implementing the route drawing animation on the `RouteLayer` component. The goal is to enhance user experience by providing a dynamic visual representation of route calculation, based on the finalized requirements in `requirements.md`.

## 🔍 Requirements Analysis

The key implementation points derived from the `requirements.md` for the RouteLayer Animation are:

-   **Visual Effect**: Animate a dashed line progressively "filling in" from the start to the end of the route. The line styling will use `line-width: 5` and `line-dasharray: [0, 1]`.
-   **Duration**: The animation must complete within a fixed duration of 1000ms for any route length.
-   **Performance**: The animation must be smooth, visually appealing, and not degrade map performance. It must be compatible with MapLibre GL.
-   **Route Updates**: If the route changes (e.g., reversed points, new geocoded address) while an animation is in progress, the current animation must stop immediately, and a new animation for the updated route should commence.
-   **Initial Display**: The initial route display upon availability should also be animated.
-   **Map Interaction**:
    -   The map view should be pre-set to fit the entire route *before* the animation begins and remain static during the animation (user can still pan/zoom manually).
    -   Basic map interactions (zoom, pan) must remain functional during animation.
-   **Error Handling**: Standard error messages for route calculation failures; animation system should not attempt to animate invalid routes. Routes with zero length or fewer than 2 points will be handled gracefully without error and without animation.
-   **Background Behavior**: If the browser tab becomes inactive, the animation should complete in the background.
-   **User Controls**: No specific user controls (e.g., skip animation button) are required.
-   **Perceived Speed**: The variation in perceived animation speed for routes of different lengths (due to fixed duration) is acceptable.

## 🛠 Implementation Policy

### Architecture Choice

-   The primary animation logic will be encapsulated within the `RouteLayer.tsx` component.
-   State related to animation (e.g., `animationStartTime`, `currentAnimationFrameId`, the GeoJSON data for the current frame of animation) will be managed locally within `RouteLayer`.
-   The `useCheckRoutes` hook will remain the source of the complete `route` data (including `route.geometry.coordinates`), which will serve as the trigger and input for the animation.

### Component Design (`RouteLayer.tsx`)

-   A `useEffect` hook will be used to manage the animation lifecycle:
    -   It will trigger when the `route` prop (from `useCheckRoutes`) changes, specifically when `route.geometry.coordinates` changes.
    -   It will be responsible for starting, managing, and cleaning up the animation (e.g., cancelling `requestAnimationFrame` on component unmount or when the route changes again).
-   Local state variables within `RouteLayer` will track:
    -   `animatedCoordinates`: An array of coordinates representing the portion of the route to be displayed at the current frame of the animation. This will be updated in each animation step.
    -   `animationStartTime`: Timestamp when the current animation started, to calculate progress against the 1000ms duration.
    -   `rafId`: The ID returned by `requestAnimationFrame` to allow for cancellation.
-   The `Source` component's `data` prop inside `RouteLayer` will be updated with a GeoJSON `LineString` object constructed from `animatedCoordinates` in each frame of the animation.

### Data Flow

1.  The complete `route` object (containing `route.geometry.coordinates`) is received from `useCheckRoutes` via props.
2.  If `route.geometry.coordinates` has fewer than 2 points, the animation is skipped, and no route (or just points if applicable) is displayed.
3.  When a new valid `route` (with 2 or more coordinates) is available or changes, `RouteLayer`'s `useEffect` triggers the animation.
4.  Inside the `requestAnimationFrame` loop:
    a.  Calculate elapsed time since `animationStartTime`.
    b.  Determine the progress of the animation (0.0 to 1.0 based on `elapsedTime / 1000ms`).
    c.  Calculate the number of coordinate points to display: `Math.ceil(progress * originalCoordinates.length)`. Ensure at least 2 points are used if progress > 0 to form a line segment.
    d.  Slice the original `route.geometry.coordinates` array from the beginning up to the calculated number of points. This becomes the `animatedCoordinates`.
    e.  Update the local state for `animatedCoordinates`. The `Source` component will then be provided with a GeoJSON LineString: `{ type: "LineString", coordinates: animatedCoordinates }`.
5.  The loop continues until 1000ms has passed or the animation is cancelled. Upon completion, `animatedCoordinates` will hold all original route coordinates.

## 🔄 Implementation Method Options and Decision

### Option 1: `requestAnimationFrame` with Manual GeoJSON LineString Slicing (based on coordinate array length)

-   **Description**:
    -   Use a `requestAnimationFrame` loop for smooth animation timing.
    -   In each frame, calculate the current number of visible coordinate points based on the animation progress (`elapsedTime / 1000ms * totalNumberOfPoints`).
    -   Generate a new GeoJSON `LineString` geometry using a subsection of the original route's coordinate array.
    -   This growing array of coordinates is styled with `line-width: 5` and `line-dasharray: [0, 1]`. The `[0, 1]` dash array combined with a growing line effectively creates a "filling in" effect as if segments are being progressively revealed.
-   **Evaluation**:
    -   *Pros*: Offers precise control. Directly integrates with MapLibre's GeoJSON sources. The "dashed line filling in" effect is achieved by progressively revealing more segments of the line. Simplifies progress calculation (based on array index rather than geographic distance).
    -   *Cons*: For routes with very sparse, long segments, the visual "jump" between revealed segments might be noticeable. However, typical route data is dense enough.

### Option 2: (Alternative methods for animating map lines - considered and less suitable for this specific effect)

-   **Description**: Methods involving animating `line-offset` or `line-gradient` with MapLibre GL JS style expressions.
-   **Evaluation**: Less suitable as they typically create "marching ants" effects or gradient shifts, not the required "growing dashed line" effect based on progressively revealing segments.

### Decision: Option 1 - `requestAnimationFrame` with Manual GeoJSON LineString Slicing (based on coordinate array length)

-   **Reason for Selection**:
    -   This method directly achieves the specified "dashed line progressively filling in" visual by actually growing the number of rendered segments from the original coordinate array.
    -   It allows for precise calculation of the visible portion of the route corresponding to the 1000ms fixed duration, using the number of coordinates as the basis for progress.
    -   It aligns well with React's declarative approach.
-   **Expected Effects**:
    -   The animation will visually match the requirement.
    -   The `line-dasharray: [0, 1]` will mean that very short segments are drawn as dots, and longer segments as lines. As more segments are added to `animatedCoordinates`, the line appears to fill in.
    -   Performance should be good as array slicing is efficient.

## 📊 Technical Constraints and Considerations

-   **Performance**: Array slicing (`slice()`) is generally performant in JavaScript. The number of points in typical routes should not pose a significant issue.
-   **Coordinate Slicing Logic**: The logic is now simpler:
    -   At each animation frame, determine the target number of points: `targetPoints = Math.max(2, Math.ceil(progress * totalOriginalPoints))`. (Ensure at least 2 points if drawing a line).
    -   `animatedCoordinates = originalCoordinates.slice(0, targetPoints)`.
-   **Smoothness**: Ensure `requestAnimationFrame` is correctly managed.
-   **MapLibre GL JS Integration**: The `line-layer`'s `paint` property will be set to:
    ```json
    {
      "line-color": "your_route_color", // From twColors.route or similar
      "line-width": 5,
      "line-dasharray": [0, 1] // Effectively makes it look like segments are drawn
    }
    ```
    The `line-cap: "round"` and `line-join: "round"` properties from the existing style should be maintained for a smoother look.
-   **State Management**: Animation-specific state remains local to `RouteLayer`.

## ❓ Technical Issues to Be Resolved

-   **(Resolved)** Specific Dash Pattern: Use `line-width: 5` and `line-dasharray: [0, 1]`. Combined with `line-cap: "round"`, this can create a "dotted" or "segmented reveal" appearance.
-   **(Resolved)** Efficient Coordinate Interpolation/Slicing: Progress will be based on the percentage of coordinates in the `route.geometry.coordinates` array. No complex geographical interpolation is needed, just array slicing.
-   **(Resolved)** Edge Cases:
    -   If `route.geometry.coordinates` has exactly 2 points, it will be animated over 1000ms (appearing as a line drawn between two points).
    -   If `route.geometry.coordinates` has fewer than 2 points (e.g., 0 or 1), or if the route data is invalid, the component should handle this gracefully: do not attempt to animate, do not render a line, and do not show an error message for this specific scenario. (Error messages for general route *calculation failures* from `useCheckRoutes` are handled separately as per requirements).
