import { v4 as uuidv4 } from "uuid";
import { executeBatch, executeQuery, executeQueryFirst, executeMutation } from "@/lib/d1-client";
import type { McqWriteInput } from "@/lib/validation/mcq";

export type McqListRow = {
	id: string;
	title: string;
	description: string;
	created_at: string;
	updated_at: string;
};

export type ChoiceRow = {
	id: string;
	question_id: string;
	label: string;
	sort_order: number;
	is_correct: number;
};

export type QuestionRow = {
	id: string;
	mcq_id: string;
	prompt: string;
	sort_order: number;
};

export type McqDetail = {
	mcq: {
		id: string;
		title: string;
		description: string;
		created_by_user_id: string;
		created_at: string;
		updated_at: string;
	};
	question: QuestionRow;
	choices: ChoiceRow[];
};

/** MCQs created by this user only (“My MCQs”). */
export async function listMcqsForUser(db: D1Database, userId: string): Promise<McqListRow[]> {
	return executeQuery<McqListRow>(
		db,
		"SELECT id, title, description, created_at, updated_at FROM mcqs WHERE created_by_user_id = ? ORDER BY updated_at DESC",
		[userId]
	);
}

export async function getMcqForOwner(db: D1Database, mcqId: string, ownerUserId: string): Promise<McqDetail | null> {
	const mcq = await executeQueryFirst<{
		id: string;
		title: string;
		description: string;
		created_by_user_id: string;
		created_at: string;
		updated_at: string;
	}>(db, "SELECT * FROM mcqs WHERE id = ?", [mcqId]);
	if (!mcq || mcq.created_by_user_id !== ownerUserId) return null;

	const question = await executeQueryFirst<QuestionRow>(
		db,
		"SELECT * FROM questions WHERE mcq_id = ? ORDER BY sort_order LIMIT 1",
		[mcqId]
	);
	if (!question) return null;

	const choices = await executeQuery<ChoiceRow>(
		db,
		"SELECT * FROM choices WHERE question_id = ? ORDER BY sort_order ASC",
		[question.id]
	);

	return {
		mcq,
		question,
		choices,
	};
}

export async function getMcqForAttempt(db: D1Database, mcqId: string): Promise<McqDetail | null> {
	const mcq = await executeQueryFirst<{
		id: string;
		title: string;
		description: string;
		created_by_user_id: string;
		created_at: string;
		updated_at: string;
	}>(db, "SELECT * FROM mcqs WHERE id = ?", [mcqId]);
	if (!mcq) return null;

	const question = await executeQueryFirst<QuestionRow>(
		db,
		"SELECT * FROM questions WHERE mcq_id = ? ORDER BY sort_order LIMIT 1",
		[mcqId]
	);
	if (!question) return null;

	const choices = await executeQuery<ChoiceRow>(
		db,
		"SELECT * FROM choices WHERE question_id = ? ORDER BY sort_order ASC",
		[question.id]
	);

	return { mcq, question, choices };
}

export async function createMcq(db: D1Database, userId: string, input: McqWriteInput): Promise<string> {
	const mcqId = uuidv4();
	const questionId = uuidv4();
	const now = new Date().toISOString();
	const desc = input.description ?? "";

	const statements: { sql: string; params?: unknown[] }[] = [
		{
			sql: `INSERT INTO mcqs (id, title, description, created_by_user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
			params: [mcqId, input.title, desc, userId, now, now],
		},
		{
			sql: `INSERT INTO questions (id, mcq_id, prompt, sort_order) VALUES (?, ?, ?, ?)`,
			params: [questionId, mcqId, input.prompt, 0],
		},
	];

	const sortedChoices = [...input.choices].sort((a, b) => a.sortOrder - b.sortOrder);
	for (let i = 0; i < sortedChoices.length; i++) {
		const c = sortedChoices[i];
		const cid = uuidv4();
		statements.push({
			sql: `INSERT INTO choices (id, question_id, label, sort_order, is_correct) VALUES (?, ?, ?, ?, ?)`,
			params: [cid, questionId, c.label, i, c.isCorrect ? 1 : 0],
		});
	}

	await executeBatch(db, statements);
	return mcqId;
}

export async function updateMcq(db: D1Database, userId: string, mcqId: string, input: McqWriteInput): Promise<boolean> {
	const existing = await getMcqForOwner(db, mcqId, userId);
	if (!existing) return false;

	const now = new Date().toISOString();
	const desc = input.description ?? "";
	const questionId = existing.question.id;

	await executeMutation(
		db,
		`UPDATE mcqs SET title = ?, description = ?, updated_at = ? WHERE id = ? AND created_by_user_id = ?`,
		[input.title, desc, now, mcqId, userId]
	);

	await executeMutation(db, `UPDATE questions SET prompt = ? WHERE id = ?`, [input.prompt, questionId]);

	await executeMutation(db, `DELETE FROM choices WHERE question_id = ?`, [questionId]);

	const sortedChoices = [...input.choices].sort((a, b) => a.sortOrder - b.sortOrder);
	const statements: { sql: string; params?: unknown[] }[] = [];
	for (let i = 0; i < sortedChoices.length; i++) {
		const c = sortedChoices[i];
		const cid = uuidv4();
		statements.push({
			sql: `INSERT INTO choices (id, question_id, label, sort_order, is_correct) VALUES (?, ?, ?, ?, ?)`,
			params: [cid, questionId, c.label, i, c.isCorrect ? 1 : 0],
		});
	}
	if (statements.length) await executeBatch(db, statements);

	return true;
}

export async function deleteMcq(db: D1Database, userId: string, mcqId: string): Promise<boolean> {
	const row = await executeQueryFirst<{ id: string }>(
		db,
		"SELECT id FROM mcqs WHERE id = ? AND created_by_user_id = ?",
		[mcqId, userId]
	);
	if (!row) return false;
	await executeMutation(db, "DELETE FROM mcqs WHERE id = ?", [mcqId]);
	return true;
}

export async function recordAttempt(
	db: D1Database,
	userId: string,
	mcqId: string,
	selectedChoiceId: string
): Promise<{ isCorrect: boolean; attemptId: string } | null> {
	const detail = await getMcqForAttempt(db, mcqId);
	if (!detail) return null;

	const choice = detail.choices.find((c) => c.id === selectedChoiceId);
	if (!choice || choice.question_id !== detail.question.id) return null;

	const isCorrect = choice.is_correct === 1;
	const attemptId = uuidv4();
	const attemptedAt = new Date().toISOString();

	await executeMutation(
		db,
		`INSERT INTO attempts (id, user_id, mcq_id, question_id, selected_choice_id, is_correct, attempted_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
		[attemptId, userId, mcqId, detail.question.id, selectedChoiceId, isCorrect ? 1 : 0, attemptedAt]
	);

	return { isCorrect, attemptId };
}
