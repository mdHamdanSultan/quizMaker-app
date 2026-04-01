import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonError(message: string, status: number) {
	return NextResponse.json({ error: message }, { status });
}

export function jsonOk<T>(data: T, status = 200) {
	return NextResponse.json(data, { status });
}

export function zodToErrorMessage(err: ZodError): string {
	const first = err.issues[0];
	return first?.message ?? "Validation failed";
}
