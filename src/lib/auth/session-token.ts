import { getSessionSecret } from "@/lib/env/session-secret";

const COOKIE_NAME = "quizmaker_session";
const MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days

export type SessionPayload = {
	userId: string;
	exp: number;
};

const enc = new TextEncoder();

function base64UrlEncode(bytes: Uint8Array): string {
	let bin = "";
	bytes.forEach((b) => {
		bin += String.fromCharCode(b);
	});
	return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(s: string): Uint8Array {
	const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
	const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
	const bin = atob(b64);
	const out = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
	return out;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
	return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

async function signPayload(payloadB64: string, secret: string): Promise<string> {
	const key = await importHmacKey(secret);
	const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payloadB64));
	return base64UrlEncode(new Uint8Array(sig));
}

export async function createSessionToken(userId: string): Promise<{ token: string; maxAgeSec: number; expiresAt: number }> {
	const secret = getSessionSecret();
	const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
	const payload: SessionPayload = { userId, exp };
	const payloadJson = JSON.stringify(payload);
	const payloadB64 = base64UrlEncode(enc.encode(payloadJson));
	const sig = await signPayload(payloadB64, secret);
	const token = `${payloadB64}.${sig}`;
	return { token, maxAgeSec: MAX_AGE_SEC, expiresAt: exp };
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
	const parts = token.split(".");
	if (parts.length !== 2) return null;
	const [payloadB64, sigB64] = parts;
	if (!payloadB64 || !sigB64) return null;
	const secret = getSessionSecret();
	const expectedSig = await signPayload(payloadB64, secret);
	if (expectedSig !== sigB64) return null;
	try {
		const json = new TextDecoder().decode(base64UrlDecode(payloadB64));
		const payload = JSON.parse(json) as SessionPayload;
		if (!payload.userId || typeof payload.exp !== "number") return null;
		if (payload.exp < Math.floor(Date.now() / 1000)) return null;
		return payload;
	} catch {
		return null;
	}
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
