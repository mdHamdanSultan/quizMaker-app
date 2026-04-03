/**
 * Filters MCQ rows by substring match on `description` (case-insensitive).
 * Empty or whitespace-only query returns all items.
 */
export function filterMcqsByDescription<T extends { description: string }>(items: T[], query: string): T[] {
	const q = query.trim().toLowerCase();
	if (!q) return items;
	return items.filter((item) => item.description.toLowerCase().includes(q));
}
