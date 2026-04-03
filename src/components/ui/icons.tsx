import { cn } from "@/lib/utils";

export function IconChevronRight({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cn("size-4", className)} aria-hidden>
			<path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

export function IconMoreHorizontal({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" className={cn("size-5", className)} aria-hidden>
			<circle cx="5" cy="12" r="2" />
			<circle cx="12" cy="12" r="2" />
			<circle cx="19" cy="12" r="2" />
		</svg>
	);
}

export function IconPencil({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cn("size-4", className)} aria-hidden>
			<path d="M12 20h9" strokeLinecap="round" />
			<path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinejoin="round" />
		</svg>
	);
}

export function IconTrash({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cn("size-4", className)} aria-hidden>
			<path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

export function IconBook({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cn("size-5", className)} aria-hidden>
			<path d="M4 19.5A2.5 2.5 0 016.5 17H20" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M8 7h8M8 11h6" strokeLinecap="round" />
		</svg>
	);
}

export function IconSearch({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cn("size-5 shrink-0 text-neutral-500", className)} aria-hidden>
			<circle cx="11" cy="11" r="7" />
			<path d="M20 20l-3-3" strokeLinecap="round" />
		</svg>
	);
}

export function IconEye({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cn("size-5", className)} aria-hidden>
			<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" strokeLinecap="round" strokeLinejoin="round" />
			<circle cx="12" cy="12" r="3" />
		</svg>
	);
}
