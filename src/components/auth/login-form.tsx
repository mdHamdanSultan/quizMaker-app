"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchJsonWithTimeout, REQUEST_TIMEOUT_MS } from "@/lib/client/http";
import { loginSchema } from "@/lib/validation/auth";
import type { z } from "zod";

type Form = z.infer<typeof loginSchema>;

export function LoginForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [error, setError] = useState<string | null>(null);
	const redirectTo = searchParams.get("redirect") || "/mcqs";

	const form = useForm<Form>({
		resolver: zodResolver(loginSchema),
		defaultValues: { identifier: "", password: "" },
	});

	async function onSubmit(values: Form) {
		setError(null);
		try {
			const res = await fetchJsonWithTimeout("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(values),
				timeoutMs: REQUEST_TIMEOUT_MS,
			});
			const data = (await res.json().catch(() => ({}))) as { error?: string };
			if (!res.ok) {
				setError(data.error ?? "Unexpected error. Please try again.");
				return;
			}
			router.push(redirectTo.startsWith("/") ? redirectTo : "/mcqs");
			router.refresh();
		} catch (e) {
			if (e instanceof Error && e.name === "AbortError") {
				setError(
					`Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s. If you are developing locally, ensure D1 migrations are applied (see docs/BASIC_AUTHENTICATION.md).`
				);
				return;
			}
			setError("Unexpected error. Please try again.");
		}
	}

	return (
		<div className="flex flex-1 items-center justify-center px-4 py-12">
			<Card className="w-full max-w-md border-neutral-300">
				<CardHeader>
					<CardTitle className="text-center">Welcome back</CardTitle>
					<CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="identifier">Username or Email</Label>
							<Input
								id="identifier"
								autoComplete="username"
								placeholder="john.doe@example.com"
								{...form.register("identifier")}
								aria-invalid={!!form.formState.errors.identifier}
							/>
							{form.formState.errors.identifier ? (
								<p className="text-sm text-neutral-800">{form.formState.errors.identifier.message}</p>
							) : null}
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								autoComplete="current-password"
								{...form.register("password")}
							/>
							{form.formState.errors.password ? (
								<p className="text-sm text-neutral-800">{form.formState.errors.password.message}</p>
							) : null}
						</div>
						{error ? <p className="text-sm text-neutral-800">{error}</p> : null}
						<Button type="submit" className="w-full font-brand-serif" size="lg" disabled={form.formState.isSubmitting}>
							{form.formState.isSubmitting ? "Signing in..." : "Log in"}
						</Button>
						<p className="text-center font-brand-serif text-sm text-neutral-600">
							Don&apos;t have an account?{" "}
							<Link href="/signup" className="text-black underline underline-offset-4 hover:no-underline">
								Sign up
							</Link>
						</p>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
