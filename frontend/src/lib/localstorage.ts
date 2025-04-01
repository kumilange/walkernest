// Check if localStorage is available
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = "__test__";
    localStorage.setItem(testKey, "test");
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

// Add object to a list in localStorage
export function addToLocalStorageList<T>(key: string, item: T): void {
  if (!isLocalStorageAvailable()) {
    console.warn("localStorage is not available");
    return;
  }

  const list = getLocalStorageList<T>(key);
  if (
    !list.some(
      (existingItem) => JSON.stringify(existingItem) === JSON.stringify(item),
    )
  ) {
    list.push(item);
    localStorage.setItem(key, JSON.stringify(list));
  }
}

// Remove object from a list in localStorage
export function removeFromLocalStorageList<T extends { id: number }>(
  key: string,
  id: number,
): void {
  if (!isLocalStorageAvailable()) {
    console.warn("localStorage is not available");
    return;
  }

  const list = getLocalStorageList<T>(key);
  const updatedList = list.filter((existingItem) => existingItem.id !== id);
  localStorage.setItem(key, JSON.stringify(updatedList));
}

// Get list of objects from localStorage
export function getLocalStorageList<T>(key: string): T[] {
  if (!isLocalStorageAvailable()) {
    console.warn("localStorage is not available");
    return [];
  }

  const list = localStorage.getItem(key);
  return list ? JSON.parse(list) : [];
}
