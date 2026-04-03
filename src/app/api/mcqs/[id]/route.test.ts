import { describe, expect, it, vi, beforeEach } from "vitest";
import { DELETE, GET } from "./route";

const readSessionPayload = vi.fn();
const getQuizmakerD1 = vi.fn();
const getMcqForOwner = vi.fn();
const getMcqForAttempt = vi.fn();
const deleteMcq = vi.fn();

vi.mock("@/lib/auth/session-cookie", () => ({
	readSessionPayload: (...args: unknown[]) => readSessionPayload(...args),
}));

vi.mock("@/lib/cloudflare", () => ({
	getQuizmakerD1: (...args: unknown[]) => getQuizmakerD1(...args),
}));

vi.mock("@/lib/services/mcq-service", () => ({
	getMcqForOwner: (...args: unknown[]) => getMcqForOwner(...args),
	getMcqForAttempt: (...args: unknown[]) => getMcqForAttempt(...args),
	deleteMcq: (...args: unknown[]) => deleteMcq(...args),
	updateMcq: vi.fn(),
}));

const mockDb = {} as D1Database;

const session = { userId: "user-1", exp: Date.now() + 99999 };

beforeEach(() => {
	vi.clearAllMocks();
	getQuizmakerD1.mockResolvedValue(mockDb);
});

describe("DELETE /api/mcqs/[id]", () => {
	it("returns 401 when there is no session", async () => {
		readSessionPayload.mockResolvedValue(null);
		const res = await DELETE(new Request("http://x"), { params: Promise.resolve({ id: "m1" }) });
		expect(res.status).toBe(401);
		expect(deleteMcq).not.toHaveBeenCalled();
	});

	it("returns 404 when deleteMcq reports not owner or missing row", async () => {
		readSessionPayload.mockResolvedValue(session);
		deleteMcq.mockResolvedValue(false);

		const res = await DELETE(new Request("http://x"), { params: Promise.resolve({ id: "m1" }) });
		expect(res.status).toBe(404);
		expect(deleteMcq).toHaveBeenCalledWith(mockDb, "user-1", "m1");
	});

	it("returns 200 when delete succeeds", async () => {
		readSessionPayload.mockResolvedValue(session);
		deleteMcq.mockResolvedValue(true);

		const res = await DELETE(new Request("http://x"), { params: Promise.resolve({ id: "m1" }) });
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.ok).toBe(true);
	});
});

describe("GET /api/mcqs/[id]", () => {
	const detail = {
		mcq: {
			id: "m1",
			title: "T",
			description: "d",
			created_by_user_id: "user-1",
			created_at: "",
			updated_at: "",
		},
		question: { id: "q1", mcq_id: "m1", prompt: "?", sort_order: 0 },
		choices: [
			{ id: "c1", question_id: "q1", label: "A", sort_order: 0, is_correct: 1 },
			{ id: "c2", question_id: "q1", label: "B", sort_order: 1, is_correct: 0 },
		],
	};

	it("returns 404 for edit when owner cannot load the MCQ", async () => {
		readSessionPayload.mockResolvedValue(session);
		getMcqForOwner.mockResolvedValue(null);

		const res = await GET(new Request("http://x?for=edit"), { params: Promise.resolve({ id: "m1" }) });
		expect(res.status).toBe(404);
	});

	it("returns edit payload when for=edit and user owns the MCQ", async () => {
		readSessionPayload.mockResolvedValue(session);
		getMcqForOwner.mockResolvedValue(detail);

		const res = await GET(new Request("http://x?for=edit"), { params: Promise.resolve({ id: "m1" }) });
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.mcq.id).toBe("m1");
		expect(body.choices[0].isCorrect).toBe(true);
	});

	it("returns take payload without isCorrect when not for=edit", async () => {
		readSessionPayload.mockResolvedValue(session);
		getMcqForAttempt.mockResolvedValue(detail);

		const res = await GET(new Request("http://x"), { params: Promise.resolve({ id: "m1" }) });
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.choices[0]).not.toHaveProperty("isCorrect");
	});
});
