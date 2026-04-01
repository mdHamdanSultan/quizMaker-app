-- QuizMaker schema: users, MCQs, questions, choices, attempts
PRAGMA foreign_keys = ON;

CREATE TABLE users (
	id TEXT PRIMARY KEY NOT NULL,
	first_name TEXT NOT NULL,
	last_name TEXT NOT NULL,
	username TEXT NOT NULL UNIQUE,
	email TEXT NOT NULL UNIQUE,
	password_hash TEXT NOT NULL,
	password_hash_algorithm TEXT NOT NULL DEFAULT 'bcrypt',
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

CREATE TABLE mcqs (
	id TEXT PRIMARY KEY NOT NULL,
	title TEXT NOT NULL,
	description TEXT NOT NULL DEFAULT '',
	created_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_mcqs_created_by ON mcqs(created_by_user_id);

CREATE TABLE questions (
	id TEXT PRIMARY KEY NOT NULL,
	mcq_id TEXT NOT NULL REFERENCES mcqs(id) ON DELETE CASCADE,
	prompt TEXT NOT NULL,
	sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_questions_mcq_id ON questions(mcq_id);

CREATE TABLE choices (
	id TEXT PRIMARY KEY NOT NULL,
	question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
	label TEXT NOT NULL,
	sort_order INTEGER NOT NULL,
	is_correct INTEGER NOT NULL CHECK (is_correct IN (0, 1))
);

CREATE INDEX idx_choices_question_id ON choices(question_id);

CREATE TABLE attempts (
	id TEXT PRIMARY KEY NOT NULL,
	user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	mcq_id TEXT NOT NULL REFERENCES mcqs(id) ON DELETE CASCADE,
	question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
	selected_choice_id TEXT NOT NULL REFERENCES choices(id),
	is_correct INTEGER NOT NULL CHECK (is_correct IN (0, 1)),
	attempted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_attempts_user_id ON attempts(user_id);
CREATE INDEX idx_attempts_mcq_id ON attempts(mcq_id);
CREATE INDEX idx_attempts_question_id ON attempts(question_id);
CREATE INDEX idx_attempts_attempted_at ON attempts(attempted_at);
