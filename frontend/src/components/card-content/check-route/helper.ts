/**
 * Formats the given duration from seconds to minutes, rounding up to the nearest whole number.
 */
export function formatDurationInMins(duration: number) {
  return Math.ceil(duration / 60);
}

/**
 * Formats the given distance in meters to an object containing the distance
 * in kilometers and miles, both rounded to one decimal place.
 */
export function formatDistance(distance: number) {
  return {
    km: (distance / 1000).toFixed(1),
    mi: (distance / 1609).toFixed(1),
  };
}
