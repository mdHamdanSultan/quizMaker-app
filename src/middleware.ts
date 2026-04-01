import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session-token";

export async function middleware(request: NextRequest) {
	const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
	const session = token ? await verifySessionToken(token) : null;

	if (!session) {
		const url = request.nextUrl.clone();
		url.pathname = "/login";
		url.searchParams.set("redirect", request.nextUrl.pathname + request.nextUrl.search);
		return NextResponse.redirect(url);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/mcqs/:path*", "/api/mcqs/:path*"],
};
