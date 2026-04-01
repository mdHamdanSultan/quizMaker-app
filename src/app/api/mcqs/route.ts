import { readSessionPayload } from "@/lib/auth/session-cookie";
import { getQuizmakerD1 } from "@/lib/cloudflare";
import { jsonError, jsonOk, zodToErrorMessage } from "@/lib/api/http";
import { createMcq, listMcqs } from "@/lib/services/mcq-service";
import { mcqWriteSchema } from "@/lib/validation/mcq";
import { ZodError } from "zod";

export const runtime = "nodejs";

export async function GET() {
	const session = await readSessionPayload();
	if (!session) return jsonError("Unauthorized", 401);

	const db = await getQuizmakerD1();
	const rows = await listMcqs(db);
	return jsonOk({ mcqs: rows });
}

export async function POST(request: Request) {
	const session = await readSessionPayload();
	if (!session) return jsonError("Unauthorized", 401);

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return jsonError("Invalid JSON body", 400);
	}

	let parsed;
	try {
		parsed = mcqWriteSchema.parse(body);
	} catch (e) {
		if (e instanceof ZodError) return jsonError(zodToErrorMessage(e), 400);
		throw e;
	}

	const db = await getQuizmakerD1();
	const id = await createMcq(db, session.userId, parsed);
	return jsonOk({ id }, 201);
}
