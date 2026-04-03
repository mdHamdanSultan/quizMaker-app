import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";

const readSessionPayload = vi.fn();
const getQuizmakerD1 = vi.fn();
const listMcqsForUser = vi.fn();
const createMcq = vi.fn();

vi.mock("@/lib/auth/session-cookie", () => ({
	readSessionPayload: (...args: unknown[]) => readSessionPayload(...args),
}));

vi.mock("@/lib/cloudflare", () => ({
	getQuizmakerD1: (...args: unknown[]) => getQuizmakerD1(...args),
}));

vi.mock("@/lib/services/mcq-service", () => ({
	listMcqsForUser: (...args: unknown[]) => listMcqsForUser(...args),
	createMcq: (...args: unknown[]) => createMcq(...args),
}));

const mockDb = {} as D1Database;

beforeEach(() => {
	vi.clearAllMocks();
	getQuizmakerD1.mockResolvedValue(mockDb);
});

describe("GET /api/mcqs", () => {
	it("returns 401 when there is no session", async () => {
		readSessionPayload.mockResolvedValue(null);

		const res = await GET();
		expect(res.status).toBe(401);
		const body = await res.json();
		expect(body.error).toBe("Unauthorized");
		expect(listMcqsForUser).not.toHaveBeenCalled();
	});

	it("returns 200 and mcqs for the session user", async () => {
		readSessionPayload.mockResolvedValue({ userId: "user-1", exp: Date.now() + 99999 });
		listMcqsForUser.mockResolvedValue([{ id: "m1", title: "T", description: "", created_at: "", updated_at: "" }]);

		const res = await GET();
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.mcqs).toHaveLength(1);
		expect(listMcqsForUser).toHaveBeenCalledWith(mockDb, "user-1");
	});
});

describe("POST /api/mcqs", () => {
	const validBody = {
		title: "New quiz",
		description: "",
		prompt: "Q?",
		choices: [
			{ label: "a", sortOrder: 0, isCorrect: true },
			{ label: "b", sortOrder: 1, isCorrect: false },
		],
	};

	it("returns 401 when there is no session", async () => {
		readSessionPayload.mockResolvedValue(null);
		const req = new Request("http://localhost/api/mcqs", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(validBody),
		});

		const res = await POST(req);
		expect(res.status).toBe(401);
		expect(createMcq).not.toHaveBeenCalled();
	});

	it("returns 400 for invalid JSON body", async () => {
		readSessionPayload.mockResolvedValue({ userId: "u1", exp: Date.now() + 99999 });
		const req = new Request("http://localhost/api/mcqs", {
			method: "POST",
			body: "not-json",
		});

		const res = await POST(req);
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.error).toBe("Invalid JSON body");
	});

	it("returns 400 when validation fails", async () => {
		readSessionPayload.mockResolvedValue({ userId: "u1", exp: Date.now() + 99999 });
		const req = new Request("http://localhost/api/mcqs", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ title: "", prompt: "x", choices: [] }),
		});

		const res = await POST(req);
		expect(res.status).toBe(400);
		expect(createMcq).not.toHaveBeenCalled();
	});

	it("returns 201 and new id when create succeeds", async () => {
		readSessionPayload.mockResolvedValue({ userId: "user-99", exp: Date.now() + 99999 });
		createMcq.mockResolvedValue("new-mcq-id");

		const req = new Request("http://localhost/api/mcqs", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(validBody),
		});

		const res = await POST(req);
		expect(res.status).toBe(201);
		const body = await res.json();
		expect(body.id).toBe("new-mcq-id");
		expect(createMcq).toHaveBeenCalledWith(mockDb, "user-99", expect.objectContaining({ title: "New quiz" }));
	});
});
