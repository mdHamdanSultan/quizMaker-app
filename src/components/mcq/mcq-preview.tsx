"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchJsonWithTimeout, REQUEST_TIMEOUT_MS } from "@/lib/client/http";

type PreviewData = {
	mcq: { id: string; title: string; description: string };
	question: { id: string; prompt: string };
	choices: { id: string; label: string; sortOrder: number }[];
};

export function McqPreview({ mcqId }: { mcqId: string }) {
	const [data, setData] = useState<PreviewData | null>(null);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [feedback, setFeedback] = useState<boolean | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	useEffect(() => {
		void (async () => {
			try {
				const res = await fetchJsonWithTimeout(`/api/mcqs/${mcqId}`, { timeoutMs: REQUEST_TIMEOUT_MS });
				const json = (await res.json().catch(() => ({}))) as { error?: string } & Partial<PreviewData>;
				if (!res.ok) {
					setLoadError(json.error ?? "Could not load quiz");
					return;
				}
				if (json.mcq && json.question && json.choices) {
					setData({
						mcq: json.mcq,
						question: json.question,
						choices: json.choices,
					});
				}
			} catch (e) {
				if (e instanceof Error && e.name === "AbortError") {
					setLoadError("Request timed out. Check local D1 migrations.");
					return;
				}
				setLoadError("Could not load quiz");
			}
		})();
	}, [mcqId]);

	async function submit() {
		if (!selectedId) {
			setSubmitError("Select an answer first");
			return;
		}
		setSubmitError(null);
		setPending(true);
		try {
			const res = await fetchJsonWithTimeout(`/api/mcqs/${mcqId}/attempts`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ selectedChoiceId: selectedId }),
				timeoutMs: REQUEST_TIMEOUT_MS,
			});
			const json = (await res.json().catch(() => ({}))) as { error?: string; isCorrect?: boolean };
			if (!res.ok) {
				setSubmitError(json.error ?? "Could not submit");
				return;
			}
			if (typeof json.isCorrect === "boolean") {
				setFeedback(json.isCorrect);
			}
		} catch (e) {
			if (e instanceof Error && e.name === "AbortError") {
				setSubmitError("Request timed out.");
				return;
			}
			setSubmitError("Unexpected error");
		} finally {
			setPending(false);
		}
	}

	if (loadError) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Error</CardTitle>
					<CardDescription>{loadError}</CardDescription>
				</CardHeader>
				<CardContent>
					<Button asChild variant="outline">
						<Link href="/mcqs">Back to list</Link>
					</Button>
				</CardContent>
			</Card>
		);
	}

	if (!data) {
		return (
			<div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-8 text-center text-slate-400">
				Loading quiz…
			</div>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-xl">{data.mcq.title}</CardTitle>
				{data.mcq.description ? <CardDescription>{data.mcq.description}</CardDescription> : null}
			</CardHeader>
			<CardContent className="space-y-6">
				<div>
					<p className="text-base leading-relaxed text-slate-100">{data.question.prompt}</p>
				</div>
				<div className="space-y-3">
					<p className="text-sm font-medium text-slate-400">Select an answer</p>
					<ul className="space-y-2">
						{[...data.choices]
							.sort((a, b) => a.sortOrder - b.sortOrder)
							.map((c) => (
								<li key={c.id}>
									<label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-700/50 bg-slate-950/40 p-3 transition-colors hover:border-slate-600/60 has-[:checked]:border-blue-500/50 has-[:checked]:bg-blue-950/20">
										<input
											type="radio"
											name="choice"
											className="mt-1 accent-blue-500"
											checked={selectedId === c.id}
											onChange={() => {
												setSelectedId(c.id);
												setFeedback(null);
											}}
										/>
										<span className="text-slate-100">{c.label}</span>
									</label>
								</li>
							))}
					</ul>
				</div>

				{feedback !== null ? (
					<p
						className={
							feedback ? "text-sm font-medium text-emerald-400" : "text-sm font-medium text-red-400"
						}
						role="status"
					>
						{feedback ? "Correct." : "Incorrect."}
					</p>
				) : null}

				{submitError ? <p className="text-sm text-red-400">{submitError}</p> : null}

				<div className="flex flex-wrap gap-3">
					<Button type="button" onClick={() => void submit()} disabled={pending}>
						{pending ? "Submitting…" : "Submit answer"}
					</Button>
					<Button type="button" variant="outline" asChild>
						<Link href="/mcqs">Back to list</Link>
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
