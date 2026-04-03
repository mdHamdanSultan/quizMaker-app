import Link from "next/link";
import { MarketingSiteHeader } from "@/components/layout/marketing-site-header";

export function AuthLandingShell({
	children,
	showAuthBar,
	showMarketingHeader,
}: {
	children: React.ReactNode;
	showAuthBar?: boolean;
	showMarketingHeader?: boolean;
}) {
	return (
		<div className="relative min-h-screen bg-white text-black">
			<div className="relative z-10 flex min-h-screen flex-col">
				{showMarketingHeader ? <MarketingSiteHeader /> : null}
				{showAuthBar ? (
					<header className="border-b border-neutral-200 bg-white px-4 py-3 text-sm">
						<Link href="/" className="text-neutral-600 transition-colors hover:text-black">
							← QuizMaker
						</Link>
					</header>
				) : null}
				<div className="flex flex-1 flex-col">{children}</div>
			</div>
		</div>
	);
}
