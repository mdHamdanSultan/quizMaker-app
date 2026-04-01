import { v4 as uuidv4 } from "uuid";
import { hashPassword, PASSWORD_HASH_ALGORITHM } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session-cookie";
import { getQuizmakerD1 } from "@/lib/cloudflare";
import { executeMutation, executeQueryFirst } from "@/lib/d1-client";
import { jsonError, jsonOk, zodToErrorMessage } from "@/lib/api/http";
import { signupSchema } from "@/lib/validation/auth";
import { ZodError } from "zod";

export const runtime = "nodejs";

export async function POST(request: Request) {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return jsonError("Invalid JSON body", 400);
	}

	let parsed;
	try {
		parsed = signupSchema.parse(body);
	} catch (e) {
		if (e instanceof ZodError) return jsonError(zodToErrorMessage(e), 400);
		throw e;
	}

	const db = await getQuizmakerD1();

	const clash = await executeQueryFirst<{ c: number }>(
		db,
		"SELECT COUNT(*) as c FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)",
		[parsed.username, parsed.email]
	);
	if (clash && Number(clash.c) > 0) {
		return jsonError("Username or email is already taken", 409);
	}

	const { hash } = await hashPassword(parsed.password);
	const id = uuidv4();
	const now = new Date().toISOString();

	await executeMutation(
		db,
		`INSERT INTO users (id, first_name, last_name, username, email, password_hash, password_hash_algorithm, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			id,
			parsed.firstName,
			parsed.lastName,
			parsed.username,
			parsed.email,
			hash,
			PASSWORD_HASH_ALGORITHM,
			now,
			now,
		]
	);

	await setSessionCookie(id);

	return jsonOk({ ok: true, userId: id });
}
