"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchJsonWithTimeout, REQUEST_TIMEOUT_MS } from "@/lib/client/http";
import { signupSchema } from "@/lib/validation/auth";
import type { z } from "zod";

type Form = z.infer<typeof signupSchema>;

export function SignupForm() {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);

	const form = useForm<Form>({
		resolver: zodResolver(signupSchema),
		defaultValues: {
			firstName: "",
			lastName: "",
			username: "",
			email: "",
			password: "",
		},
	});

	async function onSubmit(values: Form) {
		setError(null);
		try {
			const res = await fetchJsonWithTimeout("/api/auth/signup", {
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
			router.push("/mcqs");
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
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Sign Up</CardTitle>
					<CardDescription>Create your QuizMaker account.</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-2">
								<Label htmlFor="firstName">First name</Label>
								<Input id="firstName" autoComplete="given-name" {...form.register("firstName")} />
								{form.formState.errors.firstName ? (
									<p className="text-xs text-red-400">{form.formState.errors.firstName.message}</p>
								) : null}
							</div>
							<div className="space-y-2">
								<Label htmlFor="lastName">Last name</Label>
								<Input id="lastName" autoComplete="family-name" {...form.register("lastName")} />
								{form.formState.errors.lastName ? (
									<p className="text-xs text-red-400">{form.formState.errors.lastName.message}</p>
								) : null}
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="username">Username</Label>
							<Input id="username" autoComplete="username" {...form.register("username")} />
							{form.formState.errors.username ? (
								<p className="text-sm text-red-400">{form.formState.errors.username.message}</p>
							) : null}
						</div>
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input id="email" type="email" autoComplete="email" {...form.register("email")} />
							{form.formState.errors.email ? (
								<p className="text-sm text-red-400">{form.formState.errors.email.message}</p>
							) : null}
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
							{form.formState.errors.password ? (
								<p className="text-sm text-red-400">{form.formState.errors.password.message}</p>
							) : null}
						</div>
						{error ? <p className="text-sm text-red-400">{error}</p> : null}
						<Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
							{form.formState.isSubmitting ? "Creating account..." : "Create account"}
						</Button>
						<p className="text-center text-sm text-slate-400">
							Already have an account?{" "}
							<Link href="/login" className="text-blue-400 hover:underline">
								Login
							</Link>
						</p>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
