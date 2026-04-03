import { describe, expect, it } from "vitest";
import { mcqWriteSchema } from "./mcq";

describe("mcqWriteSchema", () => {
	it("accepts valid payload with exactly one correct choice", () => {
		const parsed = mcqWriteSchema.parse({
			title: "T",
			description: "D",
			prompt: "Q?",
			choices: [
				{ label: "a", sortOrder: 0, isCorrect: true },
				{ label: "b", sortOrder: 1, isCorrect: false },
			],
		});
		expect(parsed.choices).toHaveLength(2);
	});

	it("rejects when no choice is correct", () => {
		expect(() =>
			mcqWriteSchema.parse({
				title: "T",
				description: "",
				prompt: "Q",
				choices: [
					{ label: "a", sortOrder: 0, isCorrect: false },
					{ label: "b", sortOrder: 1, isCorrect: false },
				],
			})
		).toThrow();
	});

	it("rejects when more than one choice is correct", () => {
		expect(() =>
			mcqWriteSchema.parse({
				title: "T",
				description: "",
				prompt: "Q",
				choices: [
					{ label: "a", sortOrder: 0, isCorrect: true },
					{ label: "b", sortOrder: 1, isCorrect: true },
				],
			})
		).toThrow();
	});
});
