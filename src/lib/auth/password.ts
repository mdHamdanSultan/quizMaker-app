import bcrypt from "bcryptjs";

const ROUNDS = 12;
const ALGORITHM = "bcrypt" as const;

export async function hashPassword(plain: string): Promise<{ hash: string; algorithm: typeof ALGORITHM }> {
	const hash = await bcrypt.hash(plain, ROUNDS);
	return { hash, algorithm: ALGORITHM };
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
	return bcrypt.compare(plain, hash);
}

export { ALGORITHM as PASSWORD_HASH_ALGORITHM };
