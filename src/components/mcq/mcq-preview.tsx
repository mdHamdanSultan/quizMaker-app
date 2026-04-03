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
			<Card className="border-neutral-300">
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
			<div className="rounded-lg border border-neutral-300 bg-white p-8 text-center text-neutral-600">Loading quiz…</div>
		);
	}

	return (
		<>
			<Link href="/mcqs" className="mb-4 inline-block text-sm text-neutral-600 hover:text-black">
				← Back to MCQs
			</Link>
			<Card className="border-neutral-300">
				<CardHeader>
					<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
						<div>
							<CardTitle className="text-xl">{data.mcq.title}</CardTitle>
							{data.mcq.description ? <CardDescription className="mt-2">{data.mcq.description}</CardDescription> : null}
						</div>
						<span className="inline-flex w-fit rounded-full border border-neutral-300 px-3 py-1 text-xs text-neutral-600">
							Preview
						</span>
					</div>
				</CardHeader>
				<CardContent className="space-y-6">
					<div>
						<p className="text-base leading-relaxed text-black">{data.question.prompt}</p>
					</div>
					<div className="space-y-3">
						<p className="text-sm font-medium text-neutral-600">Select an answer</p>
						<ul className="space-y-2">
							{[...data.choices]
								.sort((a, b) => a.sortOrder - b.sortOrder)
								.map((c) => {
									const selected = selectedId === c.id;
									return (
										<li key={c.id}>
											<button
												type="button"
												onClick={() => {
													setSelectedId(c.id);
													setFeedback(null);
												}}
												className={`w-full rounded-md border border-neutral-300 px-4 py-3 text-left text-black transition-colors ${
													selected ? "bg-neutral-100" : "bg-white hover:bg-neutral-50"
												}`}
											>
												{c.label}
											</button>
										</li>
									);
								})}
						</ul>
					</div>

					{feedback !== null ? (
						<p className="text-sm font-medium text-black" role="status">
							{feedback ? "Correct." : "Incorrect."}
						</p>
					) : null}

					{submitError ? <p className="text-sm text-neutral-800">{submitError}</p> : null}

					<div className="flex flex-col gap-3 sm:flex-row">
						<Button
							type="button"
							className="w-full bg-neutral-500 font-medium text-white hover:bg-neutral-600 sm:max-w-xs"
							onClick={() => void submit()}
							disabled={pending}
						>
							{pending ? "Submitting…" : "Submit answer"}
						</Button>
						<Button type="button" variant="outline" asChild>
							<Link href="/mcqs">Back to list</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		</>
	);
}
