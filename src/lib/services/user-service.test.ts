import { describe, expect, it, vi, beforeEach } from "vitest";
import { findUserByUsernameOrEmail } from "./user-service";

vi.mock("@/lib/d1-client", () => ({
	executeQueryFirst: vi.fn(),
}));

import * as d1 from "@/lib/d1-client";

const mockDb = {} as D1Database;

beforeEach(() => {
	vi.clearAllMocks();
});

describe("findUserByUsernameOrEmail", () => {
	it("returns null when identifier is empty after trim", async () => {
		const user = await findUserByUsernameOrEmail(mockDb, "   ");
		expect(user).toBeNull();
		expect(d1.executeQueryFirst).not.toHaveBeenCalled();
	});

	it("returns user found by username lookup first", async () => {
		const row = {
			id: "u1",
			first_name: "A",
			last_name: "B",
			username: "alice",
			email: "a@x.com",
			password_hash: "h",
			password_hash_algorithm: "argon2",
			created_at: "",
			updated_at: "",
		};
		vi.mocked(d1.executeQueryFirst).mockResolvedValueOnce(row);

		const user = await findUserByUsernameOrEmail(mockDb, "alice");
		expect(user).toEqual(row);
		expect(d1.executeQueryFirst).toHaveBeenCalledTimes(1);
	});

	it("falls back to email when username does not match", async () => {
		const row = {
			id: "u2",
			first_name: "B",
			last_name: "C",
			username: "bob",
			email: "bob@x.com",
			password_hash: "h",
			password_hash_algorithm: "argon2",
			created_at: "",
			updated_at: "",
		};
		vi.mocked(d1.executeQueryFirst).mockResolvedValueOnce(null).mockResolvedValueOnce(row);

		const user = await findUserByUsernameOrEmail(mockDb, "bob@x.com");
		expect(user).toEqual(row);
		expect(d1.executeQueryFirst).toHaveBeenCalledTimes(2);
	});
});
