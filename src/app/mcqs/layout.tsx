import { QuizAppShell } from "@/components/layout/quiz-app-shell";
import { readSessionPayload } from "@/lib/auth/session-cookie";
import { getQuizmakerD1 } from "@/lib/cloudflare";
import { findUserById } from "@/lib/services/user-service";

export const dynamic = "force-dynamic";

export default async function McqsLayout({ children }: { children: React.ReactNode }) {
	const session = await readSessionPayload();
	let userDisplayName: string | undefined;
	if (session) {
		const db = await getQuizmakerD1();
		const user = await findUserById(db, session.userId);
		if (user) {
			const full = `${user.first_name} ${user.last_name}`.trim();
			userDisplayName = full || user.username;
		}
	}

	return <QuizAppShell userDisplayName={userDisplayName}>{children}</QuizAppShell>;
}
