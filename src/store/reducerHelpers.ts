// src/store/reducerHelpers.ts
// Shared helper functions used by reducer handler modules.

/** Trim whitespace from a name value. */
export function normalizedName(value: string): string {
  return value.trim();
}

/** Check if a category name is unique (case-insensitive), optionally excluding a given ID. */
export function isCategoryNameAvailable(
  categories: { id: string; name: string }[],
  name: string,
  excludingID?: string,
): boolean {
  return !categories.some((category) => {
    if (excludingID && category.id === excludingID) return false;
    return category.name.toLowerCase() === name.toLowerCase();
  });
}

/** Check if a group name is unique (case-insensitive), optionally excluding a given ID. */
export function isGroupNameAvailable(
  groups: { id: string; name: string }[],
  name: string,
  excludingID?: string,
): boolean {
  return !groups.some((group) => {
    if (excludingID && group.id === excludingID) return false;
    return group.name.toLowerCase() === name.toLowerCase();
  });
}
