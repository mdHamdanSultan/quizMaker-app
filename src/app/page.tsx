import Link from "next/link";
import { AuthLandingShell } from "@/components/layout/auth-landing-shell";
import { Button } from "@/components/ui/button";

export default function HomePage() {
	return (
		<AuthLandingShell showMarketingHeader>
			<div className="flex flex-1 flex-col items-center justify-center px-4 py-20">
				<div className="mx-auto max-w-2xl text-center">
					<h1 className="font-brand-serif mb-4 text-4xl font-semibold tracking-tight text-black sm:text-5xl">QuizMaker</h1>
					<p className="mb-8 text-lg text-neutral-600">
						Create multiple-choice quizzes aligned with your teaching goals. Sign up to build quizzes and keep attempts
						recorded in one place.
					</p>
					<div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
						<Button asChild size="lg" className="min-w-[160px] font-brand-serif">
							<Link href="/signup">Sign up</Link>
						</Button>
						<Button asChild size="lg" variant="outline" className="min-w-[160px]">
							<Link href="/login">Log in</Link>
						</Button>
					</div>
				</div>
			</div>
		</AuthLandingShell>
	);
}
