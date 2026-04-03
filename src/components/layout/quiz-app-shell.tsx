import Link from "next/link";
import { LogoutButton } from "@/components/layout/logout-button";
import { IconBook } from "@/components/ui/icons";

export function QuizAppShell({
	children,
	userDisplayName,
}: {
	children: React.ReactNode;
	/** Shown next to Log out when loaded from session */
	userDisplayName?: string;
}) {
	return (
		<div className="relative min-h-screen bg-white text-black">
			<div className="relative z-10 flex min-h-screen flex-col">
				<header className="border-b border-neutral-200 bg-white">
					<div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
						<Link href="/mcqs" className="flex items-center gap-2 font-brand-serif text-xl font-semibold tracking-tight text-black">
							<IconBook className="size-6" />
							QuizMaker
						</Link>
						<nav className="flex items-center gap-3 sm:gap-4">
							{userDisplayName ? (
								<span className="hidden text-sm text-neutral-600 sm:inline">{userDisplayName}</span>
							) : null}
							<LogoutButton />
						</nav>
					</div>
				</header>
				<main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6">{children}</main>
			</div>
		</div>
	);
}
