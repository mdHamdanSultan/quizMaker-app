import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session-cookie";
import { getQuizmakerD1 } from "@/lib/cloudflare";
import { jsonError, jsonOk, zodToErrorMessage } from "@/lib/api/http";
import { findUserByUsernameOrEmail } from "@/lib/services/user-service";
import { loginSchema } from "@/lib/validation/auth";
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
		parsed = loginSchema.parse(body);
	} catch (e) {
		if (e instanceof ZodError) return jsonError(zodToErrorMessage(e), 400);
		throw e;
	}

	const db = await getQuizmakerD1();
	const user = await findUserByUsernameOrEmail(db, parsed.identifier);
	if (!user) {
		return jsonError("Invalid username or password", 401);
	}

	const ok = await verifyPassword(parsed.password, user.password_hash);
	if (!ok) {
		return jsonError("Invalid username or password", 401);
	}

	await setSessionCookie(user.id);

	return jsonOk({ ok: true, userId: user.id });
}
