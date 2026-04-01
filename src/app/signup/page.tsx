import { redirect } from "next/navigation";
import { AuthLandingShell } from "@/components/layout/auth-landing-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { readSessionPayload } from "@/lib/auth/session-cookie";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
	if (await readSessionPayload()) redirect("/mcqs");

	return (
		<AuthLandingShell showAuthBar>
			<SignupForm />
		</AuthLandingShell>
	);
}
