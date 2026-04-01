import { z, ZodError } from "zod";
import { readSessionPayload } from "@/lib/auth/session-cookie";
import { getQuizmakerD1 } from "@/lib/cloudflare";
import { jsonError, jsonOk, zodToErrorMessage } from "@/lib/api/http";
import { recordAttempt } from "@/lib/services/mcq-service";

export const runtime = "nodejs";

const bodySchema = z.object({
	selectedChoiceId: z.string().min(1, "Choice is required"),
});

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
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
		parsed = bodySchema.parse(body);
	} catch (e) {
		if (e instanceof ZodError) return jsonError(zodToErrorMessage(e), 400);
		throw e;
	}

	const { id: mcqId } = await ctx.params;
	const db = await getQuizmakerD1();
	const result = await recordAttempt(db, session.userId, mcqId, parsed.selectedChoiceId);
	if (!result) {
		return jsonError("Invalid quiz or choice", 400);
	}

	return jsonOk({
		isCorrect: result.isCorrect,
		attemptId: result.attemptId,
	});
}
