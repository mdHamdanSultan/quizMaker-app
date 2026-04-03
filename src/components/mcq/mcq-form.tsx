"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchJsonWithTimeout, REQUEST_TIMEOUT_MS } from "@/lib/client/http";
import type { McqWriteInput } from "@/lib/validation/mcq";

type ChoiceDraft = { label: string; isCorrect: boolean };

function buildPayload(
	title: string,
	description: string,
	prompt: string,
	choices: ChoiceDraft[]
): McqWriteInput {
	return {
		title: title.trim(),
		description: description.trim(),
		prompt: prompt.trim(),
		choices: choices.map((c, i) => ({
			label: c.label.trim(),
			sortOrder: i,
			isCorrect: c.isCorrect,
		})),
	};
}

function validateClient(title: string, prompt: string, choices: ChoiceDraft[]): string | null {
	if (!title.trim()) return "Title is required";
	if (!prompt.trim()) return "Question text is required";
	const nonEmpty = choices.filter((c) => c.label.trim().length > 0);
	if (nonEmpty.length < 2) return "Enter at least two choices with text";
	if (nonEmpty.length > 4) return "At most four choices";
	const correct = nonEmpty.filter((c) => c.isCorrect);
	if (correct.length !== 1) return "Mark exactly one filled-in choice as correct";
	return null;
}

type McqFormProps = {
	mode: "create" | "edit";
	mcqId?: string;
	initial?: {
		title: string;
		description: string;
		prompt: string;
		choices: { label: string; sortOrder: number; isCorrect: boolean }[];
	};
};

function initialChoicesFromProps(initial?: McqFormProps["initial"]): ChoiceDraft[] {
	if (!initial) {
		return [
			{ label: "", isCorrect: true },
			{ label: "", isCorrect: false },
		];
	}
	const sorted = [...initial.choices].sort((a, b) => a.sortOrder - b.sortOrder);
	return sorted.map((c) => ({ label: c.label, isCorrect: c.isCorrect }));
}

export function McqForm({ mode, mcqId, initial }: McqFormProps) {
	const router = useRouter();
	const [title, setTitle] = useState(() => initial?.title ?? "");
	const [description, setDescription] = useState(() => initial?.description ?? "");
	const [prompt, setPrompt] = useState(() => initial?.prompt ?? "");
	const [choices, setChoices] = useState<ChoiceDraft[]>(() => initialChoicesFromProps(initial));
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	function setCorrect(index: number) {
		setChoices((prev) => prev.map((c, i) => ({ ...c, isCorrect: i === index })));
	}

	function addChoice() {
		setChoices((prev) => {
			if (prev.length >= 4) return prev;
			return [...prev, { label: "", isCorrect: false }];
		});
	}

	function removeChoice(index: number) {
		setChoices((prev) => {
			if (prev.length <= 2) return prev;
			const next = prev.filter((_, i) => i !== index);
			if (!next.some((c) => c.isCorrect)) next[0] = { ...next[0], isCorrect: true };
			return next;
		});
	}

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		const nonEmptyChoices = choices.filter((c) => c.label.trim().length > 0);
		const msg = validateClient(title, prompt, nonEmptyChoices);
		if (msg) {
			setError(msg);
			return;
		}
		const payload = buildPayload(title, description, prompt, nonEmptyChoices);

		setPending(true);
		try {
			if (mode === "create") {
				const res = await fetchJsonWithTimeout("/api/mcqs", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
					timeoutMs: REQUEST_TIMEOUT_MS,
				});
				const data = (await res.json().catch(() => ({}))) as { error?: string; id?: string };
				if (!res.ok) {
					setError(data.error ?? "Could not create quiz");
					return;
				}
				router.push("/mcqs");
				router.refresh();
				return;
			}

			const res = await fetchJsonWithTimeout(`/api/mcqs/${mcqId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
				timeoutMs: REQUEST_TIMEOUT_MS,
			});
			const data = (await res.json().catch(() => ({}))) as { error?: string };
			if (!res.ok) {
				setError(data.error ?? "Could not save quiz");
				return;
			}
			router.push("/mcqs");
			router.refresh();
		} catch (err) {
			if (err instanceof Error && err.name === "AbortError") {
				setError(`Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s. Check local D1 migrations.`);
				return;
			}
			setError("Unexpected error. Please try again.");
		} finally {
			setPending(false);
		}
	}

	const formTitle = mode === "create" ? "Create New MCQ" : "Edit MCQ";

	return (
		<>
			<Link href="/mcqs" className="mb-4 inline-block text-sm text-neutral-600 hover:text-black">
				← Back to MCQs
			</Link>
			<Card className="border-neutral-300">
				<CardHeader>
					<CardTitle>{formTitle}</CardTitle>
					<CardDescription>Title, description, one question, and 2–4 choices. Mark exactly one choice as the correct answer.</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={(e) => void onSubmit(e)} className="space-y-6">
						<div className="space-y-2">
							<Label htmlFor="title">Title</Label>
							<Input
								id="title"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="e.g. Photosynthesis Basics"
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="description">Description (optional)</Label>
							<Textarea
								id="description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								rows={3}
								placeholder="Brief description of this question…"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="prompt">Question</Label>
							<Textarea
								id="prompt"
								value={prompt}
								onChange={(e) => setPrompt(e.target.value)}
								rows={4}
								placeholder="Enter your question here…"
								required
							/>
						</div>

						<div className="space-y-3">
							<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
								<Label>Answer choices (2–4, click circle to mark correct)</Label>
								{choices.length < 4 ? (
									<Button type="button" variant="outline" size="sm" onClick={addChoice}>
										+ Add choice
									</Button>
								) : null}
							</div>
							{choices.map((c, index) => (
								<div
									key={index}
									className="flex flex-col gap-2 rounded-md border border-neutral-300 p-3 sm:flex-row sm:items-center"
								>
									<div className="flex flex-1 items-center gap-2">
										<input
											type="radio"
											name="correct"
											checked={c.isCorrect}
											onChange={() => setCorrect(index)}
											className="size-4 accent-black"
											aria-label={`Mark choice ${index + 1} as correct`}
										/>
										<Input
											placeholder={`Choice ${index + 1}`}
											value={c.label}
											onChange={(e) => {
												const v = e.target.value;
												setChoices((prev) => prev.map((x, i) => (i === index ? { ...x, label: v } : x)));
											}}
										/>
									</div>
									<div className="flex items-center gap-3 pl-7 sm:pl-0">
										{choices.length > 2 ? (
											<Button type="button" variant="ghost" size="sm" onClick={() => removeChoice(index)}>
												Remove
											</Button>
										) : null}
									</div>
								</div>
							))}
						</div>

						{error ? <p className="text-sm text-neutral-800">{error}</p> : null}

						<div className="flex flex-wrap gap-3">
							<Button type="submit" className="font-brand-serif" disabled={pending}>
								{pending ? "Saving…" : mode === "create" ? "Create MCQ" : "Save changes"}
							</Button>
							<Button type="button" variant="outline" asChild>
								<Link href="/mcqs">Cancel</Link>
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</>
	);
}
