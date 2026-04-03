import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "./route";

const getQuizmakerD1 = vi.fn();
const findUserByUsernameOrEmail = vi.fn();
const verifyPassword = vi.fn();
const setSessionCookie = vi.fn();

vi.mock("@/lib/cloudflare", () => ({
	getQuizmakerD1: (...args: unknown[]) => getQuizmakerD1(...args),
}));

vi.mock("@/lib/services/user-service", () => ({
	findUserByUsernameOrEmail: (...args: unknown[]) => findUserByUsernameOrEmail(...args),
}));

vi.mock("@/lib/auth/password", () => ({
	verifyPassword: (...args: unknown[]) => verifyPassword(...args),
}));

vi.mock("@/lib/auth/session-cookie", () => ({
	setSessionCookie: (...args: unknown[]) => setSessionCookie(...args),
}));

const mockDb = {} as D1Database;

const userRow = {
	id: "user-1",
	first_name: "A",
	last_name: "B",
	username: "alice",
	email: "a@x.com",
	password_hash: "hash",
	password_hash_algorithm: "argon2",
	created_at: "",
	updated_at: "",
};

beforeEach(() => {
	vi.clearAllMocks();
	getQuizmakerD1.mockResolvedValue(mockDb);
});

describe("POST /api/auth/login", () => {
	it("returns 400 for invalid JSON", async () => {
		const req = new Request("http://localhost/api/auth/login", {
			method: "POST",
			body: "not-json",
		});
		const res = await POST(req);
		expect(res.status).toBe(400);
	});

	it("returns 400 when validation fails", async () => {
		const req = new Request("http://localhost/api/auth/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ identifier: "", password: "" }),
		});
		const res = await POST(req);
		expect(res.status).toBe(400);
		expect(findUserByUsernameOrEmail).not.toHaveBeenCalled();
	});

	it("returns 401 when user is not found", async () => {
		findUserByUsernameOrEmail.mockResolvedValue(null);

		const req = new Request("http://localhost/api/auth/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ identifier: "nobody", password: "secret123" }),
		});
		const res = await POST(req);
		expect(res.status).toBe(401);
		expect(verifyPassword).not.toHaveBeenCalled();
	});

	it("returns 401 when password does not match", async () => {
		findUserByUsernameOrEmail.mockResolvedValue(userRow);
		verifyPassword.mockResolvedValue(false);

		const req = new Request("http://localhost/api/auth/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ identifier: "alice", password: "wrong" }),
		});
		const res = await POST(req);
		expect(res.status).toBe(401);
		expect(setSessionCookie).not.toHaveBeenCalled();
	});

	it("sets session cookie and returns 200 on success", async () => {
		findUserByUsernameOrEmail.mockResolvedValue(userRow);
		verifyPassword.mockResolvedValue(true);

		const req = new Request("http://localhost/api/auth/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ identifier: "alice", password: "correct-password" }),
		});
		const res = await POST(req);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.ok).toBe(true);
		expect(body.userId).toBe("user-1");
		expect(setSessionCookie).toHaveBeenCalledWith("user-1");
	});
});
