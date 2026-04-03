import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env/session-secret", () => ({
	getSessionSecret: () => "test-session-secret-min-32-characters!",
}));

import { createSessionToken, verifySessionToken } from "./session-token";

describe("session-token", () => {
	it("round-trips createSessionToken and verifySessionToken", async () => {
		const { token } = await createSessionToken("user-uuid-123");
		const payload = await verifySessionToken(token);
		expect(payload).not.toBeNull();
		expect(payload?.userId).toBe("user-uuid-123");
		expect(payload?.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
	});

	it("returns null for malformed token", async () => {
		expect(await verifySessionToken("not-a-token")).toBeNull();
		expect(await verifySessionToken("onlyonepart")).toBeNull();
	});
});
