import { McqPreview } from "@/components/mcq/mcq-preview";

export default async function PreviewMcqPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	return <McqPreview mcqId={id} />;
}
