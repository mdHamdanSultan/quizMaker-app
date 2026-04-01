import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function getQuizmakerD1(): Promise<D1Database> {
	const { env } = await getCloudflareContext({ async: true });
	const db = env.quizmaker_app_database;
	if (!db) {
		throw new Error("D1 binding quizmaker_app_database is not configured");
	}
	return db;
}
