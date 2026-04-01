import Link from "next/link";
import { FloatingParticlesBackground } from "@/components/layout/floating-particles";
import { MarketingSiteHeader } from "@/components/layout/marketing-site-header";

export function AuthLandingShell({
	children,
	showAuthBar,
	showMarketingHeader,
}: {
	children: React.ReactNode;
	showAuthBar?: boolean;
	/** Top nav: serif brand + Log in / Sign up + divider line */
	showMarketingHeader?: boolean;
}) {
	return (
		<div className="relative min-h-screen overflow-hidden bg-[#020617] text-slate-100">
			<FloatingParticlesBackground />
			<div className="relative z-10 flex min-h-screen flex-col">
				{showMarketingHeader ? <MarketingSiteHeader /> : null}
				{showAuthBar ? (
					<header className="border-b border-slate-800/60 bg-slate-950/40 px-4 py-3 text-sm backdrop-blur">
						<Link href="/" className="text-slate-400 transition-colors hover:text-slate-200">
							← QuizMaker
						</Link>
					</header>
				) : null}
				<div className="flex flex-1 flex-col">{children}</div>
			</div>
		</div>
	);
}
