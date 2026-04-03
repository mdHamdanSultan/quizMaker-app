import { describe, expect, it } from "vitest";
import { loginSchema, signupSchema } from "./auth";

describe("loginSchema", () => {
	it("accepts identifier and password", () => {
		const parsed = loginSchema.parse({
			identifier: "teacher1",
			password: "secret",
		});
		expect(parsed.identifier).toBe("teacher1");
	});

	it("rejects empty identifier", () => {
		expect(() => loginSchema.parse({ identifier: "", password: "x" })).toThrow();
	});
});

describe("signupSchema", () => {
	it("accepts a valid signup payload", () => {
		const parsed = signupSchema.parse({
			firstName: "Ada",
			lastName: "Lovelace",
			username: "ada_1",
			email: "ada@example.com",
			password: "hunter2123",
		});
		expect(parsed.username).toBe("ada_1");
	});

	it("rejects username with invalid characters", () => {
		expect(() =>
			signupSchema.parse({
				firstName: "A",
				lastName: "B",
				username: "bad name",
				email: "a@b.co",
				password: "12345678",
			})
		).toThrow();
	});

	it("rejects short password", () => {
		expect(() =>
			signupSchema.parse({
				firstName: "A",
				lastName: "B",
				username: "ab",
				email: "a@b.co",
				password: "short",
			})
		).toThrow();
	});
});
