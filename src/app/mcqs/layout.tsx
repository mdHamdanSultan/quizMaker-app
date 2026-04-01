import { QuizAppShell } from "@/components/layout/quiz-app-shell";

export default function McqsLayout({ children }: { children: React.ReactNode }) {
	return <QuizAppShell>{children}</QuizAppShell>;
}
