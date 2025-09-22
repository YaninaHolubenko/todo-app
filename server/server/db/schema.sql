-- server/db/schema.sql
CREATE TABLE IF NOT EXISTS users (
  email TEXT PRIMARY KEY,
  hashed_password TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY,
  user_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  title TEXT NOT NULL,
  progress INTEGER NOT NULL CHECK (progress >= 0 AND progress <= 100),
  date TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  priority INTEGER NOT NULL CHECK (priority BETWEEN 1 AND 3)
);

CREATE INDEX IF NOT EXISTS idx_todos_user_email ON todos(user_email);
CREATE INDEX IF NOT EXISTS idx_todos_date ON todos(date);
