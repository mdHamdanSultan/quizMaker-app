import Link from "next/link";
import { FloatingParticlesBackground } from "@/components/layout/floating-particles";
import { LogoutButton } from "@/components/layout/logout-button";

export function QuizAppShell({ children }: { children: React.ReactNode }) {
	return (
		<div className="relative min-h-screen overflow-hidden bg-[#020617] text-slate-100">
			<FloatingParticlesBackground />
			<div className="relative z-10 flex min-h-screen flex-col">
				<header className="border-b border-slate-800/60 bg-slate-950/50 px-4 py-4 backdrop-blur">
					<div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
						<Link href="/mcqs" className="text-lg font-semibold tracking-tight text-slate-50">
							QuizMaker
						</Link>
						<nav className="flex items-center gap-3">
							<Link
								href="/mcqs"
								className="text-sm text-slate-400 transition-colors hover:text-slate-100"
							>
								My MCQs
							</Link>
							<LogoutButton />
						</nav>
					</div>
				</header>
				<main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8">{children}</main>
			</div>
		</div>
	);
}
