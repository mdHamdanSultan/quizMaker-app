import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthLandingShell } from "@/components/layout/auth-landing-shell";
import { LoginForm } from "@/components/auth/login-form";
import { readSessionPayload } from "@/lib/auth/session-cookie";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
	if (await readSessionPayload()) redirect("/mcqs");

	return (
		<AuthLandingShell showAuthBar>
			<Suspense
				fallback={
					<div className="flex flex-1 items-center justify-center text-slate-400">Loading…</div>
				}
			>
				<LoginForm />
			</Suspense>
		</AuthLandingShell>
	);
}
