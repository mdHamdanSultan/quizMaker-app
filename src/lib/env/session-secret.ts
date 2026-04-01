/**
 * Session signing secret. Set SESSION_SECRET in .dev.vars / Wrangler secrets for production.
 */
export function getSessionSecret(): string {
	const s = process.env.SESSION_SECRET;
	if (s && s.length >= 16) return s;
	if (process.env.NODE_ENV === "production") {
		throw new Error("SESSION_SECRET must be set to a strong value in production");
	}
	return "dev-only-session-secret-replace-in-prod-32b";
}
