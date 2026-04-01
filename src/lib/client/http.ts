export const REQUEST_TIMEOUT_MS = 60_000;

export async function fetchJsonWithTimeout(
	input: RequestInfo | URL,
	init: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
	const { timeoutMs = REQUEST_TIMEOUT_MS, ...rest } = init;
	const ctrl = new AbortController();
	const t = setTimeout(() => ctrl.abort(), timeoutMs);
	try {
		return await fetch(input, { ...rest, signal: ctrl.signal });
	} finally {
		clearTimeout(t);
	}
}
