/**
 * Normalize anonymous `?` placeholders to `?1`, `?2`, … for reliable D1 binding.
 */
function normalizePlaceholders(sql: string, paramCount: number): string {
	if (!sql.includes("?")) return sql;
	let i = 0;
	return sql.replace(/\?/g, () => {
		i += 1;
		if (i > paramCount) return "?";
		return `?${i}`;
	});
}

export async function executeQuery<T extends Record<string, unknown>>(
	db: D1Database,
	sql: string,
	params: unknown[] = []
): Promise<T[]> {
	const stmt = normalizePlaceholders(sql, params.length);
	const bound = db.prepare(stmt).bind(...params);
	const { results } = await bound.all<T>();
	return results ?? [];
}

export async function executeQueryFirst<T extends Record<string, unknown>>(
	db: D1Database,
	sql: string,
	params: unknown[] = []
): Promise<T | null> {
	const rows = await executeQuery<T>(db, sql, params);
	return rows[0] ?? null;
}

export async function executeMutation(
	db: D1Database,
	sql: string,
	params: unknown[] = []
): Promise<D1Result> {
	const stmt = normalizePlaceholders(sql, params.length);
	return db.prepare(stmt).bind(...params).run();
}

export async function executeBatch(
	db: D1Database,
	statements: { sql: string; params?: unknown[] }[]
): Promise<D1Result[]> {
	const batch = statements.map(({ sql, params = [] }) => {
		const stmt = normalizePlaceholders(sql, params.length);
		return db.prepare(stmt).bind(...params);
	});
	return db.batch(batch);
}
