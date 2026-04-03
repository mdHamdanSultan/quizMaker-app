import { redirect } from "next/navigation";
import { readSessionPayload } from "@/lib/auth/session-cookie";
import { getQuizmakerD1 } from "@/lib/cloudflare";
import { listMcqsForUser } from "@/lib/services/mcq-service";
import { McqListTable } from "@/components/mcq/mcq-list-table";

export const dynamic = "force-dynamic";

export default async function McqsPage() {
	const session = await readSessionPayload();
	if (!session) redirect("/login");

	const db = await getQuizmakerD1();
	const mcqs = await listMcqsForUser(db, session.userId);
	return <McqListTable initialMcqs={mcqs} />;
}
