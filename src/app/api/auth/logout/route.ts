import { clearSessionCookie } from "@/lib/auth/session-cookie";
import { jsonOk } from "@/lib/api/http";

export async function POST() {
	await clearSessionCookie();
	return jsonOk({ ok: true });
}
