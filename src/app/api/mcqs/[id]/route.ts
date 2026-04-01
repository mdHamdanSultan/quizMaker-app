import { readSessionPayload } from "@/lib/auth/session-cookie";
import { getQuizmakerD1 } from "@/lib/cloudflare";
import { jsonError, jsonOk, zodToErrorMessage } from "@/lib/api/http";
import { deleteMcq, getMcqForAttempt, getMcqForOwner, updateMcq } from "@/lib/services/mcq-service";
import { mcqWriteSchema } from "@/lib/validation/mcq";
import { ZodError } from "zod";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
	const session = await readSessionPayload();
	if (!session) return jsonError("Unauthorized", 401);

	const { id } = await ctx.params;
	const db = await getQuizmakerD1();
	const forEdit = new URL(request.url).searchParams.get("for") === "edit";

	if (forEdit) {
		const detail = await getMcqForOwner(db, id, session.userId);
		if (!detail) return jsonError("Not found", 404);
		return jsonOk({
			mcq: detail.mcq,
			question: detail.question,
			choices: detail.choices.map((c) => ({
				id: c.id,
				label: c.label,
				sortOrder: c.sort_order,
				isCorrect: c.is_correct === 1,
			})),
		});
	}

	const detail = await getMcqForAttempt(db, id);
	if (!detail) return jsonError("Not found", 404);

	return jsonOk({
		mcq: {
			id: detail.mcq.id,
			title: detail.mcq.title,
			description: detail.mcq.description,
		},
		question: {
			id: detail.question.id,
			prompt: detail.question.prompt,
		},
		choices: detail.choices.map((c) => ({
			id: c.id,
			label: c.label,
			sortOrder: c.sort_order,
		})),
	});
}

export async function PATCH(request: Request, ctx: Ctx) {
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

	const { id } = await ctx.params;
	const db = await getQuizmakerD1();
	const ok = await updateMcq(db, session.userId, id, parsed);
	if (!ok) return jsonError("Not found", 404);
	return jsonOk({ ok: true });
}

export async function DELETE(_request: Request, ctx: Ctx) {
	const session = await readSessionPayload();
	if (!session) return jsonError("Unauthorized", 401);

	const { id } = await ctx.params;
	const db = await getQuizmakerD1();
	const ok = await deleteMcq(db, session.userId, id);
	if (!ok) return jsonError("Not found", 404);
	return jsonOk({ ok: true });
}
