import { executeQueryFirst } from "@/lib/d1-client";

export type UserRow = {
	id: string;
	first_name: string;
	last_name: string;
	username: string;
	email: string;
	password_hash: string;
	password_hash_algorithm: string;
	created_at: string;
	updated_at: string;
};

export async function findUserById(db: D1Database, id: string): Promise<UserRow | null> {
	return executeQueryFirst<UserRow>(db, "SELECT * FROM users WHERE id = ?", [id]);
}

export async function findUserByUsername(db: D1Database, username: string): Promise<UserRow | null> {
	return executeQueryFirst<UserRow>(db, "SELECT * FROM users WHERE LOWER(username) = LOWER(?)", [
		username.trim(),
	]);
}

export async function findUserByEmail(db: D1Database, email: string): Promise<UserRow | null> {
	return executeQueryFirst<UserRow>(db, "SELECT * FROM users WHERE LOWER(email) = LOWER(?)", [
		email.trim(),
	]);
}

export async function findUserByUsernameOrEmail(db: D1Database, identifier: string): Promise<UserRow | null> {
	const q = identifier.trim();
	if (!q) return null;
	const byUser = await findUserByUsername(db, q);
	if (byUser) return byUser;
	return findUserByEmail(db, q);
}
