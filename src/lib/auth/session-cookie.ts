import { cookies } from "next/headers";
import {
	createSessionToken,
	SESSION_COOKIE_NAME,
	verifySessionToken,
	type SessionPayload,
} from "@/lib/auth/session-token";

export async function setSessionCookie(userId: string): Promise<void> {
	const { token, maxAgeSec } = await createSessionToken(userId);
	const store = await cookies();
	store.set(SESSION_COOKIE_NAME, token, {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		path: "/",
		maxAge: maxAgeSec,
	});
}

export async function clearSessionCookie(): Promise<void> {
	const store = await cookies();
	store.set(SESSION_COOKIE_NAME, "", {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		path: "/",
		maxAge: 0,
	});
}

export async function readSessionPayload(): Promise<SessionPayload | null> {
	const store = await cookies();
	const raw = store.get(SESSION_COOKIE_NAME)?.value;
	if (!raw) return null;
	return verifySessionToken(raw);
}

export async function requireUserId(): Promise<string> {
	const p = await readSessionPayload();
	if (!p) throw new Error("UNAUTHORIZED");
	return p.userId;
}
