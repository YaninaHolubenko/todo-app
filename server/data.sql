-- server/data.sql
-- NOTE: Do not create the database here (Neon/Render usually provide it).
-- Run this schema inside your existing database.

CREATE TABLE IF NOT EXISTS users (
  email VARCHAR(255) PRIMARY KEY,
  hashed_password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  title VARCHAR(120) NOT NULL,
  progress INT NOT NULL CHECK (progress BETWEEN 0 AND 100),
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  priority SMALLINT NOT NULL DEFAULT 2 CHECK (priority BETWEEN 1 AND 3)
);

CREATE INDEX IF NOT EXISTS idx_todos_user_date ON todos(user_email, date DESC);
