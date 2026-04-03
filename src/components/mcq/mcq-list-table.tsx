"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { IconBook, IconEye, IconPencil, IconSearch, IconTrash } from "@/components/ui/icons";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { filterMcqsByDescription } from "@/lib/mcq/filter-by-description";
import { fetchJsonWithTimeout, REQUEST_TIMEOUT_MS } from "@/lib/client/http";

export type McqRow = {
	id: string;
	title: string;
	description: string;
	created_at: string;
	updated_at: string;
};

function formatCreated(iso: string): string {
	try {
		return new Date(iso).toLocaleDateString();
	} catch {
		return "";
	}
}

export function McqListTable({ initialMcqs }: { initialMcqs: McqRow[] }) {
	const router = useRouter();
	const [mcqs, setMcqs] = useState(initialMcqs);
	const [searchQuery, setSearchQuery] = useState("");
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [deleteError, setDeleteError] = useState<string | null>(null);

	const filtered = useMemo(() => filterMcqsByDescription(mcqs, searchQuery), [mcqs, searchQuery]);

	const libraryLabel =
		mcqs.length === 0
			? "0 questions in your library"
			: `${mcqs.length} ${mcqs.length === 1 ? "question" : "questions"} in your library`;

	async function confirmDelete() {
		if (!deleteId) return;
		setDeleteError(null);
		setDeleting(true);
		try {
			const res = await fetchJsonWithTimeout(`/api/mcqs/${deleteId}`, {
				method: "DELETE",
				timeoutMs: REQUEST_TIMEOUT_MS,
			});
			if (!res.ok) {
				const data = (await res.json().catch(() => ({}))) as { error?: string };
				setDeleteError(data.error ?? "Could not delete");
				return;
			}
			setMcqs((prev) => prev.filter((m) => m.id !== deleteId));
			setDeleteId(null);
			router.refresh();
		} catch {
			setDeleteError("Could not delete. Try again.");
		} finally {
			setDeleting(false);
		}
	}

	return (
		<>
			<div className="mb-8 flex flex-col gap-6">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<h1 className="font-brand-serif text-3xl font-semibold tracking-tight text-black">My MCQs</h1>
						<p className="mt-1 text-sm text-neutral-600">{libraryLabel}</p>
					</div>
					<Button asChild className="shrink-0 font-brand-serif">
						<Link href="/mcqs/create">+ Create MCQ</Link>
					</Button>
				</div>

				<div className="relative">
					<span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
						<IconSearch />
					</span>
					<Input
						type="search"
						placeholder="Search MCQs..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="h-11 rounded-full border-neutral-300 pl-10 pr-4"
						aria-label="Search MCQs by description"
					/>
				</div>
				<p className="text-xs text-neutral-500">Search matches the <span className="font-medium text-neutral-700">description</span> you enter when creating an MCQ.</p>
			</div>

			{mcqs.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-lg border border-neutral-300 bg-white px-6 py-16 text-center">
					<IconBook className="mb-4 size-14 text-neutral-400" />
					<p className="font-brand-serif text-lg font-semibold text-black">No MCQs yet</p>
					<p className="mt-2 max-w-sm text-sm text-neutral-600">Create your first multiple choice question.</p>
					<Button asChild className="mt-6 font-brand-serif">
						<Link href="/mcqs/create">+ Create MCQ</Link>
					</Button>
				</div>
			) : filtered.length === 0 ? (
				<div className="rounded-lg border border-neutral-300 bg-white px-6 py-12 text-center">
					<p className="text-sm text-neutral-600">No MCQs match your search.</p>
					<Button type="button" variant="ghost" className="mt-2" onClick={() => setSearchQuery("")}>
						Clear search
					</Button>
				</div>
			) : (
				<ul className="flex flex-col gap-4">
					{filtered.map((m) => (
						<li key={m.id}>
							<div
								className="cursor-pointer rounded-lg border border-black bg-white p-4 shadow-sm transition-colors hover:bg-neutral-50"
								onClick={() => router.push(`/mcqs/${m.id}/preview`)}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										router.push(`/mcqs/${m.id}/preview`);
									}
								}}
								role="button"
								tabIndex={0}
							>
								<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
									<div className="min-w-0 flex-1">
										<div className="flex flex-wrap items-center gap-2">
											<span className="font-brand-serif text-lg font-semibold text-black">{m.title}</span>
											<span className="rounded-full border border-neutral-300 px-2 py-0.5 text-xs text-neutral-600">
												MCQ
											</span>
										</div>
										{m.description ? (
											<p className="mt-2 line-clamp-3 text-sm text-neutral-700">{m.description}</p>
										) : null}
										<p className="mt-3 text-xs text-neutral-500">Created {formatCreated(m.created_at)}</p>
									</div>
									<div
										className="flex shrink-0 items-center gap-1 sm:ml-4"
										onClick={(e) => e.stopPropagation()}
										onKeyDown={(e) => e.stopPropagation()}
									>
										<Button variant="ghost" size="icon" className="text-black" asChild aria-label="View">
											<Link href={`/mcqs/${m.id}/preview`}>
												<IconEye />
											</Link>
										</Button>
										<Button variant="ghost" size="icon" className="text-black" asChild aria-label="Edit">
											<Link href={`/mcqs/${m.id}/edit`}>
												<IconPencil />
											</Link>
										</Button>
										<Button
											variant="ghost"
											size="icon"
											className="text-black"
											aria-label="Delete"
											onClick={() => {
												setDeleteId(m.id);
												setDeleteError(null);
											}}
										>
											<IconTrash />
										</Button>
									</div>
								</div>
							</div>
						</li>
					))}
				</ul>
			)}

			<AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete this quiz?</AlertDialogTitle>
						<AlertDialogDescription>
							This removes the quiz, its questions and choices, and all attempts for this quiz. This cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					{deleteError ? <p className="text-sm text-neutral-800">{deleteError}</p> : null}
					<AlertDialogFooter>
						<AlertDialogCancel disabled={deleting} type="button">
							Cancel
						</AlertDialogCancel>
						<Button type="button" variant="default" disabled={deleting} onClick={() => void confirmDelete()}>
							{deleting ? "Deleting…" : "Delete"}
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
