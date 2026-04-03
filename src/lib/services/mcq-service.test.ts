import { describe, expect, it, vi, beforeEach } from "vitest";
import {
	createMcq,
	deleteMcq,
	getMcqForOwner,
	listMcqsForUser,
	recordAttempt,
} from "./mcq-service";
import type { McqWriteInput } from "@/lib/validation/mcq";

vi.mock("@/lib/d1-client", () => ({
	executeQuery: vi.fn(),
	executeQueryFirst: vi.fn(),
	executeMutation: vi.fn(),
	executeBatch: vi.fn(),
}));

vi.mock("uuid", () => ({
	v4: vi.fn(),
}));

import * as d1 from "@/lib/d1-client";
import { v4 as uuidv4 } from "uuid";

const mockDb = {} as D1Database;

const validInput: McqWriteInput = {
	title: "Quiz",
	description: "Desc",
	prompt: "What is 2+2?",
	choices: [
		{ label: "3", sortOrder: 1, isCorrect: false },
		{ label: "4", sortOrder: 0, isCorrect: true },
	],
};

beforeEach(() => {
	vi.clearAllMocks();
	let n = 0;
	vi.mocked(uuidv4).mockImplementation(() => {
		n += 1;
		return `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
	});
});

describe("listMcqsForUser", () => {
	it("queries only MCQs for the given user id", async () => {
		vi.mocked(d1.executeQuery).mockResolvedValue([]);

		await listMcqsForUser(mockDb, "user-abc");

		expect(d1.executeQuery).toHaveBeenCalledWith(
			mockDb,
			expect.stringContaining("created_by_user_id"),
			["user-abc"]
		);
	});

	it("returns rows from executeQuery", async () => {
		const rows = [
			{
				id: "m1",
				title: "T",
				description: "d",
				created_at: "t1",
				updated_at: "t2",
			},
		];
		vi.mocked(d1.executeQuery).mockResolvedValue(rows);

		const result = await listMcqsForUser(mockDb, "u1");
		expect(result).toEqual(rows);
	});
});

describe("getMcqForOwner", () => {
	it("returns null when mcq exists but belongs to another user", async () => {
		vi.mocked(d1.executeQueryFirst).mockResolvedValueOnce({
			id: "mcq-1",
			title: "T",
			description: "",
			created_by_user_id: "owner-other",
			created_at: "",
			updated_at: "",
		});

		const result = await getMcqForOwner(mockDb, "mcq-1", "current-user");
		expect(result).toBeNull();
	});

	it("returns null when question row is missing", async () => {
		vi.mocked(d1.executeQueryFirst)
			.mockResolvedValueOnce({
				id: "mcq-1",
				title: "T",
				description: "",
				created_by_user_id: "u1",
				created_at: "",
				updated_at: "",
			})
			.mockResolvedValueOnce(null);

		const result = await getMcqForOwner(mockDb, "mcq-1", "u1");
		expect(result).toBeNull();
	});

	it("returns mcq, question, and choices for the owner", async () => {
		vi.mocked(d1.executeQueryFirst)
			.mockResolvedValueOnce({
				id: "mcq-1",
				title: "T",
				description: "d",
				created_by_user_id: "u1",
				created_at: "c1",
				updated_at: "c2",
			})
			.mockResolvedValueOnce({
				id: "q1",
				mcq_id: "mcq-1",
				prompt: "P?",
				sort_order: 0,
			});
		vi.mocked(d1.executeQuery).mockResolvedValueOnce([
			{
				id: "ch1",
				question_id: "q1",
				label: "A",
				sort_order: 0,
				is_correct: 1,
			},
		]);

		const result = await getMcqForOwner(mockDb, "mcq-1", "u1");
		expect(result?.mcq.id).toBe("mcq-1");
		expect(result?.question.id).toBe("q1");
		expect(result?.choices).toHaveLength(1);
	});
});

describe("createMcq", () => {
	it("runs a batch with mcq, question, and choice inserts sorted by sortOrder", async () => {
		vi.mocked(d1.executeBatch).mockResolvedValue([]);

		await createMcq(mockDb, "user-1", validInput);

		expect(d1.executeBatch).toHaveBeenCalledTimes(1);
		const batch = vi.mocked(d1.executeBatch).mock.calls[0][1];
		expect(batch).toHaveLength(4);

		expect(batch[0].sql).toMatch(/INSERT INTO mcqs/i);
		expect(batch[0].params).toEqual(
			expect.arrayContaining(["user-1", "Quiz", "Desc"])
		);

		expect(batch[1].sql).toMatch(/INSERT INTO questions/i);
		expect(batch[1].params?.[2]).toBe("What is 2+2?");

		expect(batch[2].sql).toMatch(/INSERT INTO choices/i);
		expect(batch[3].sql).toMatch(/INSERT INTO choices/i);
		const labels = [batch[2].params?.[2], batch[3].params?.[2]].sort();
		expect(labels).toEqual(["3", "4"]);
	});
});

describe("deleteMcq", () => {
	it("returns false when no row matches owner", async () => {
		vi.mocked(d1.executeQueryFirst).mockResolvedValue(null);

		const ok = await deleteMcq(mockDb, "user-1", "missing-mcq");
		expect(ok).toBe(false);
		expect(d1.executeMutation).not.toHaveBeenCalled();
	});

	it("deletes by id when owner matches", async () => {
		vi.mocked(d1.executeQueryFirst).mockResolvedValue({ id: "mcq-1" });
		vi.mocked(d1.executeMutation).mockResolvedValue({} as D1Result);

		const ok = await deleteMcq(mockDb, "user-1", "mcq-1");
		expect(ok).toBe(true);
		expect(d1.executeMutation).toHaveBeenCalledWith(
			mockDb,
			expect.stringContaining("DELETE FROM mcqs"),
			["mcq-1"]
		);
	});
});

describe("recordAttempt", () => {
	it("returns null when selected choice does not belong to the question", async () => {
		vi.mocked(d1.executeQueryFirst)
			.mockResolvedValueOnce({
				id: "mcq-1",
				title: "T",
				description: "",
				created_by_user_id: "u0",
				created_at: "",
				updated_at: "",
			})
			.mockResolvedValueOnce({
				id: "q1",
				mcq_id: "mcq-1",
				prompt: "?",
				sort_order: 0,
			});
		vi.mocked(d1.executeQuery).mockResolvedValueOnce([
			{
				id: "c1",
				question_id: "q1",
				label: "A",
				sort_order: 0,
				is_correct: 1,
			},
		]);

		const result = await recordAttempt(mockDb, "u1", "mcq-1", "wrong-choice-id");
		expect(result).toBeNull();
		expect(d1.executeMutation).not.toHaveBeenCalled();
	});
});
