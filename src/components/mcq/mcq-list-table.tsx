"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconMoreHorizontal, IconPencil, IconTrash } from "@/components/ui/icons";
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchJsonWithTimeout, REQUEST_TIMEOUT_MS } from "@/lib/client/http";

export type McqRow = {
	id: string;
	title: string;
	description: string;
	created_at: string;
	updated_at: string;
};

export function McqListTable({ initialMcqs }: { initialMcqs: McqRow[] }) {
	const router = useRouter();
	const [mcqs, setMcqs] = useState(initialMcqs);
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [deleteError, setDeleteError] = useState<string | null>(null);

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
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<h1 className="text-2xl font-semibold text-slate-50">Multiple Choice Questions</h1>
				<Button asChild className="shrink-0">
					<Link href="/mcqs/create">Create MCQ</Link>
				</Button>
			</div>

			{mcqs.length === 0 ? (
				<div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 p-10 text-center">
					<p className="mb-4 text-slate-400">No quizzes yet. Create your first multiple-choice quiz.</p>
					<Button asChild>
						<Link href="/mcqs/create">Create MCQ</Link>
					</Button>
				</div>
			) : (
				<div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 overflow-hidden">
					<Table>
						<TableHeader>
							<TableRow className="border-slate-800 hover:bg-transparent">
								<TableHead>Title</TableHead>
								<TableHead className="hidden md:table-cell">Description</TableHead>
								<TableHead className="w-[100px] text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{mcqs.map((m) => (
								<TableRow
									key={m.id}
									className="cursor-pointer"
									onClick={() => router.push(`/mcqs/${m.id}/preview`)}
								>
									<TableCell className="font-medium text-slate-100">{m.title}</TableCell>
									<TableCell className="hidden max-w-md truncate text-slate-400 md:table-cell">
										{m.description || "—"}
									</TableCell>
									<TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="icon" className="text-slate-300" aria-label="Actions">
													<IconMoreHorizontal />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem asChild>
													<Link href={`/mcqs/${m.id}/edit`} className="flex items-center gap-2">
														<IconPencil />
														Edit
													</Link>
												</DropdownMenuItem>
												<DropdownMenuItem
													className="text-red-400 focus:text-red-300"
													onSelect={() => {
														setDeleteId(m.id);
														setDeleteError(null);
													}}
												>
													<IconTrash className="mr-2" />
													Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}

			<AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete this quiz?</AlertDialogTitle>
						<AlertDialogDescription>
							This removes the quiz, its questions and choices, and all attempts for this quiz. This cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					{deleteError ? <p className="text-sm text-red-400">{deleteError}</p> : null}
					<AlertDialogFooter>
						<AlertDialogCancel disabled={deleting} type="button">
							Cancel
						</AlertDialogCancel>
						<Button
							type="button"
							variant="destructive"
							disabled={deleting}
							onClick={() => void confirmDelete()}
						>
							{deleting ? "Deleting…" : "Delete"}
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
