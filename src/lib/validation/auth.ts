import { z } from "zod";

export const signupSchema = z.object({
	firstName: z.string().trim().min(1, "First name is required").max(120),
	lastName: z.string().trim().min(1, "Last name is required").max(120),
	username: z
		.string()
		.trim()
		.min(2, "Username must be at least 2 characters")
		.max(64)
		.regex(/^[a-zA-Z0-9_-]+$/, "Username may only contain letters, numbers, underscores, and hyphens"),
	email: z.string().trim().email("Enter a valid email address").max(320),
	password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const loginSchema = z.object({
	identifier: z.string().trim().min(1, "Username or email is required"),
	password: z.string().min(1, "Password is required"),
});
