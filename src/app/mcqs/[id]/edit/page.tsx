import { notFound } from "next/navigation";
import { McqForm } from "@/components/mcq/mcq-form";
import { readSessionPayload } from "@/lib/auth/session-cookie";
import { getQuizmakerD1 } from "@/lib/cloudflare";
import { getMcqForOwner } from "@/lib/services/mcq-service";

export const dynamic = "force-dynamic";

export default async function EditMcqPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const session = await readSessionPayload();
	if (!session) notFound();

	const db = await getQuizmakerD1();
	const detail = await getMcqForOwner(db, id, session.userId);
	if (!detail) notFound();

	return (
		<McqForm
			mode="edit"
			mcqId={id}
			initial={{
				title: detail.mcq.title,
				description: detail.mcq.description,
				prompt: detail.question.prompt,
				choices: detail.choices.map((c) => ({
					label: c.label,
					sortOrder: c.sort_order,
					isCorrect: c.is_correct === 1,
				})),
			}}
		/>
	);
}
