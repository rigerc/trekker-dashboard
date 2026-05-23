/**
 * Generic topological sort using Kahn's algorithm.
 *
 * Sorts items so that prerequisites (items depended on) appear before
 * dependents. Falls back to ascending priority for cycles and stable
 * ordering for items with no dependency relationship.
 *
 * Handles missing dependsOn entries gracefully — references to items
 * not in the input set are ignored.
 */

export interface TopoSortable {
  id: string;
  dependsOn?: string[];
  priority?: number;
}

export function topologicalSort<T extends TopoSortable>(items: T[]): T[] {
  if (items.length === 0) return [];

  const idSet = new Set(items.map((item) => item.id));
  const itemById = new Map<string, T>(items.map((item) => [item.id, item]));

  // Build adjacency: in-degree count and adjacency list (dependency → dependents)
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();

  for (const item of items) {
    inDegree.set(item.id, 0);
    dependents.set(item.id, []);
  }

  for (const item of items) {
    const deps = item.dependsOn ?? [];
    for (const depId of deps) {
      // Ignore dependencies on items not in the current set
      if (!idSet.has(depId) || depId === item.id) continue;
      const current = inDegree.get(item.id) ?? 0;
      inDegree.set(item.id, current + 1);
      dependents.get(depId)!.push(item.id);
    }
  }

  // Initialize queue with zero in-degree items, sorted by priority for stable order
  const queue = items
    .filter((item) => (inDegree.get(item.id) ?? 0) === 0)
    .sort((a, b) => (a.priority ?? 2) - (b.priority ?? 2));

  const result: T[] = [];

  while (queue.length > 0) {
    // Pop first item (highest priority among available)
    const current = queue.shift()!;
    result.push(current);

    // Decrease in-degree for dependents
    for (const depId of dependents.get(current.id) ?? []) {
      const newDegree = (inDegree.get(depId) ?? 0) - 1;
      inDegree.set(depId, newDegree);
      if (newDegree === 0) {
        // Insert into queue maintaining priority order
        const dependentItem = itemById.get(depId)!;
        insertSorted(queue, dependentItem, (item) => item.priority ?? 2);
      }
    }
  }

  // If result is shorter than input, there's a cycle — append remaining items
  // sorted by ascending priority as fallback
  if (result.length < items.length) {
    const remaining = items.filter((item) => !new Set(result.map((r) => r.id)).has(item.id));
    remaining.sort((a, b) => (a.priority ?? 2) - (b.priority ?? 2));
    result.push(...remaining);
  }

  return result;
}

/**
 * Insert an item into a sorted array maintaining ascending order by key.
 */
function insertSorted<T>(arr: T[], item: T, keyFn: (item: T) => number): void {
  const itemKey = keyFn(item);
  let lo = 0;
  let hi = arr.length;

  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (keyFn(arr[mid]!) < itemKey) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }

  arr.splice(lo, 0, item);
}
