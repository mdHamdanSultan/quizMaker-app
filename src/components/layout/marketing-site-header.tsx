import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IconBook } from "@/components/ui/icons";

export function MarketingSiteHeader() {
	return (
		<header className="border-b border-neutral-200 bg-white">
			<div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
				<Link
					href="/"
					className="flex items-center gap-2 text-2xl tracking-tight text-black transition-opacity hover:opacity-80 sm:text-[1.75rem] font-brand-serif"
				>
					<IconBook className="size-7 text-black" />
					QuizMaker
				</Link>
				<nav className="flex shrink-0 items-center gap-2 sm:gap-3" aria-label="Account">
					<Button asChild variant="ghost" size="sm" className="text-black hover:bg-neutral-100">
						<Link href="/login">Log in</Link>
					</Button>
					<Button asChild size="sm" className="font-brand-serif">
						<Link href="/signup">Sign up</Link>
					</Button>
				</nav>
			</div>
		</header>
	);
}
