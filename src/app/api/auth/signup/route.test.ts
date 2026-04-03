import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "./route";

const getQuizmakerD1 = vi.fn();
const executeQueryFirst = vi.fn();
const executeMutation = vi.fn();
const setSessionCookie = vi.fn();

vi.mock("@/lib/cloudflare", () => ({
	getQuizmakerD1: (...args: unknown[]) => getQuizmakerD1(...args),
}));

vi.mock("@/lib/d1-client", () => ({
	executeQueryFirst: (...args: unknown[]) => executeQueryFirst(...args),
	executeMutation: (...args: unknown[]) => executeMutation(...args),
}));

vi.mock("@/lib/auth/session-cookie", () => ({
	setSessionCookie: (...args: unknown[]) => setSessionCookie(...args),
}));

vi.mock("@/lib/auth/password", () => ({
	hashPassword: vi.fn().mockResolvedValue({ hash: "hashed-secret" }),
	PASSWORD_HASH_ALGORITHM: "argon2id",
}));

vi.mock("uuid", () => ({
	v4: vi.fn(() => "00000000-0000-4000-8000-000000000099"),
}));

const mockDb = {} as D1Database;

const validBody = {
	firstName: "Test",
	lastName: "User",
	username: "testuser",
	email: "test@example.com",
	password: "password123",
};

beforeEach(() => {
	vi.clearAllMocks();
	getQuizmakerD1.mockResolvedValue(mockDb);
});

describe("POST /api/auth/signup", () => {
	it("returns 400 for invalid JSON", async () => {
		const req = new Request("http://localhost/api/auth/signup", {
			method: "POST",
			body: "not-json",
		});
		const res = await POST(req);
		expect(res.status).toBe(400);
	});

	it("returns 400 when validation fails", async () => {
		const req = new Request("http://localhost/api/auth/signup", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ ...validBody, email: "not-an-email" }),
		});
		const res = await POST(req);
		expect(res.status).toBe(400);
		expect(executeQueryFirst).not.toHaveBeenCalled();
	});

	it("returns 409 when username or email already exists", async () => {
		executeQueryFirst.mockResolvedValue({ c: 1 });

		const req = new Request("http://localhost/api/auth/signup", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(validBody),
		});
		const res = await POST(req);
		expect(res.status).toBe(409);
		expect(executeMutation).not.toHaveBeenCalled();
		expect(setSessionCookie).not.toHaveBeenCalled();
	});

	it("inserts user, sets session, returns 200 on success", async () => {
		executeQueryFirst.mockResolvedValue({ c: 0 });
		executeMutation.mockResolvedValue({ success: true } as D1Result);

		const req = new Request("http://localhost/api/auth/signup", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(validBody),
		});
		const res = await POST(req);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.ok).toBe(true);
		expect(body.userId).toBe("00000000-0000-4000-8000-000000000099");

		expect(executeMutation).toHaveBeenCalledWith(
			mockDb,
			expect.stringContaining("INSERT INTO users"),
			expect.arrayContaining(["testuser", "test@example.com", "hashed-secret"])
		);
		expect(setSessionCookie).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000099");
	});
});
