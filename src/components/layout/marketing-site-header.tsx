import Link from "next/link";
import { Button } from "@/components/ui/button";

export function MarketingSiteHeader() {
	return (
		<header className="border-b border-slate-600/30 bg-slate-950/45 backdrop-blur-md">
			<div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
				<Link
					href="/"
					className="text-2xl tracking-tight text-slate-50 transition-opacity hover:opacity-90 sm:text-[1.75rem] [font-family:var(--font-brand-serif),ui-serif,Georgia,serif]"
				>
					QuizMaker
				</Link>
				<nav className="flex shrink-0 items-center gap-2 sm:gap-3" aria-label="Account">
					<Button asChild variant="ghost" size="sm" className="text-slate-300 hover:bg-slate-800/80 hover:text-slate-50">
						<Link href="/login">Log in</Link>
					</Button>
					<Button asChild size="sm" className="shadow-md shadow-blue-900/20">
						<Link href="/signup">Sign up</Link>
					</Button>
				</nav>
			</div>
		</header>
	);
}
