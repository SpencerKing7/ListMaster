// src/features/settings/hooks/useExpandedGroups.ts
// Manages which category groups are expanded in the settings UI.

import { useState, useCallback, useEffect } from "react";
import type { CategoryGroup } from "@/models/types";

// MARK: - Types

/** Return type for {@link useExpandedGroups}. */
export interface UseExpandedGroupsReturn {
  /** Set of currently expanded group IDs. */
  expandedGroupIDs: Set<string>;
  /** Low-level setter — used by drag logic for bulk collapse/restore. */
  setExpandedGroupIDs: React.Dispatch<React.SetStateAction<Set<string>>>;
  /** Toggles a single group's expanded/collapsed state. */
  toggleGroup: (groupID: string) => void;
}

// MARK: - Hook

/**
 * Owns the expanded/collapsed state for category groups.
 *
 * Automatically removes stale group IDs when groups are deleted.
 * New groups start collapsed by default.
 *
 * @param groups - The current groups array from the store.
 */
export function useExpandedGroups(
  groups: CategoryGroup[],
): UseExpandedGroupsReturn {
  const [expandedGroupIDs, setExpandedGroupIDs] = useState<Set<string>>(
    () => new Set(),
  );

  // Sync expandedGroupIDs when groups change (remove stale).
  useEffect(() => {
    setExpandedGroupIDs((prev) => {
      const currentGroupIDs = new Set(groups.map((g) => g.id));
      const next = new Set(prev);
      for (const id of next) {
        if (!currentGroupIDs.has(id)) next.delete(id);
      }
      return next;
    });
  }, [groups]);

  const toggleGroup = useCallback((groupID: string) => {
    setExpandedGroupIDs((prev) => {
      const next = new Set(prev);
      if (next.has(groupID)) {
        next.delete(groupID);
      } else {
        next.add(groupID);
      }
      return next;
    });
  }, []);

  return { expandedGroupIDs, setExpandedGroupIDs, toggleGroup };
}
