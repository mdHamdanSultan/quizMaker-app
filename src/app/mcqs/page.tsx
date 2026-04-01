import { getQuizmakerD1 } from "@/lib/cloudflare";
import { listMcqs } from "@/lib/services/mcq-service";
import { McqListTable } from "@/components/mcq/mcq-list-table";

export const dynamic = "force-dynamic";

export default async function McqsPage() {
	const db = await getQuizmakerD1();
	const mcqs = await listMcqs(db);
	return <McqListTable initialMcqs={mcqs} />;
}
