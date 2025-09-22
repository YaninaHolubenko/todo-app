-- server/db/seed.sql
-- Demo user (password hash for "password123")
INSERT INTO users (email, hashed_password)
VALUES (
  'demo@demo.com',
  '$2b$10$1b9XJ8IkCQ2HJOmrxLwM0O4x9YrbIed6pNfw0Lz7ZfflSg6Gxq2sO'
)
ON CONFLICT (email) DO NOTHING;

-- Demo todo
INSERT INTO todos (id, user_email, title, progress, date, completed, priority)
VALUES (
  gen_random_uuid(),
  'demo@demo.com',
  'Try the app',
  20,
  NOW()::text,
  false,
  2
);
