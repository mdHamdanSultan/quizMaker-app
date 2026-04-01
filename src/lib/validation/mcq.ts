import { z } from "zod";

const choiceSchema = z.object({
	label: z.string().trim().min(1, "Each choice needs text").max(2000),
	sortOrder: z.number().int().min(0),
	isCorrect: z.boolean(),
});

export const mcqWriteSchema = z
	.object({
		title: z.string().trim().min(1, "Title is required").max(500),
		description: z.string().max(5000),
		prompt: z.string().trim().min(1, "Question text is required").max(8000),
		choices: z.array(choiceSchema).min(2, "At least two choices are required").max(4, "At most four choices"),
	})
	.refine((data) => data.choices.filter((c) => c.isCorrect).length === 1, {
		message: "Exactly one choice must be marked correct",
		path: ["choices"],
	});

export type McqWriteInput = z.infer<typeof mcqWriteSchema>;
