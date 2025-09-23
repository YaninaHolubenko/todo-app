// server/__tests__/todos.test.js
const request = require('supertest');

// Mock the DB layer with in-memory users and todos
jest.mock('../db', () => {
  const users = new Map(); // email -> { email, hashed_password }
  const todos = new Map(); // id -> row

  // naive id for tests
  let counter = 0;
  const makeId = () => `00000000-0000-4000-8000-${String(++counter).padStart(12, '0')}`;

  return {
    __users: users,
    __todos: todos,
    query: async (sql, params) => {
      const text = String(sql).toLowerCase();

      // ----- users queries (for auth) -----
      if (text.includes('insert into users') && text.includes('(email, hashed_password)')) {
        const [email, hashed_password] = params;
        if (users.has(email)) {
          const err = new Error('duplicate key');
          err.code = '23505';
          throw err;
        }
        users.set(email, { email, hashed_password });
        return { rows: [], rowCount: 1 };
      }

      if (text.includes('select * from users where email = $1')) {
        const [email] = params;
        const row = users.get(email);
        return row ? { rows: [row], rowCount: 1 } : { rows: [], rowCount: 0 };
      }

      // ----- todos queries -----
      if (text.startsWith('select * from todos where user_email = $1 order by date desc')) {
        const [user_email] = params;
        const rows = Array.from(todos.values())
          .filter(t => t.user_email === user_email)
          .sort((a, b) => String(b.date).localeCompare(String(a.date)));
        return { rows, rowCount: rows.length };
      }

      if (text.startsWith('insert into todos')) {
        // INSERT ... RETURNING *
        const [id, user_email, title, progress, date, completed, priority] = params;
        const row = { id: id || makeId(), user_email, title, progress, date, completed, priority };
        todos.set(row.id, row);
        return { rows: [row], rowCount: 1 };
      }

      if (text.startsWith('select * from todos where id = $1 and user_email = $2')) {
        const [id, user_email] = params;
        const row = todos.get(id);
        if (!row || row.user_email !== user_email) return { rows: [], rowCount: 0 };
        return { rows: [row], rowCount: 1 };
      }

      if (text.startsWith('update todos set')) {
        // UPDATE ... RETURNING *
        const [title, progress, date, completed, priority, id, user_email] = params;
        const row = todos.get(id);
        if (!row || row.user_email !== user_email) return { rows: [], rowCount: 0 };
        const updated = { ...row, title, progress, date, completed, priority };
        todos.set(id, updated);
        return { rows: [updated], rowCount: 1 };
      }

      if (text.startsWith('delete from todos where id = $1 and user_email = $2')) {
        const [id, user_email] = params;
        const row = todos.get(id);
        if (!row || row.user_email !== user_email) return { rows: [], rowCount: 0 };
        todos.delete(id);
        return { rows: [], rowCount: 1 };
      }

      return { rows: [], rowCount: 0 };
    },
    end: async () => {},
  };
});

const app = require('../server');

const TEST_EMAIL = 'todo-user@example.com';
const TEST_PASS = 'secret123';

beforeAll(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
});

describe('todos flow (DB mocked)', () => {
  const agent = request.agent(app);
  let createdId;

  it('auth: signup or login', async () => {
    const r1 = await agent.post('/signup').send({ email: TEST_EMAIL, password: TEST_PASS });
    if (r1.status !== 204 && r1.status !== 409) {
      throw new Error(`Unexpected signup status: ${r1.status}`);
    }
    const r2 = await agent.post('/login').send({ email: TEST_EMAIL, password: TEST_PASS });
    expect(r2.status).toBe(204);
  });

  it('POST /todos creates a todo and returns full row', async () => {
    const res = await agent.post('/todos').send({
      title: 'First task',
      progress: 10,
      priority: 2,
      completed: false,
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: 'First task',
      progress: 10,
      priority: 2,
      completed: false,
      user_email: TEST_EMAIL,
    });
    expect(res.body.id).toBeDefined();
    createdId = res.body.id;
  });

  it('GET /todos/:userEmail returns user todos', async () => {
    const res = await agent.get(`/todos/${TEST_EMAIL}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some(t => t.id === createdId)).toBe(true);
  });

  it('PUT /todos/:id partially updates a todo and returns full row', async () => {
    const res = await agent.put(`/todos/${createdId}`).send({
      progress: 55,
      completed: true,
    });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: createdId,
      progress: 55,
      completed: true,
      user_email: TEST_EMAIL,
    });
  });

  it('DELETE /todos/:id removes the todo', async () => {
    const res = await agent.delete(`/todos/${createdId}`);
    expect(res.status).toBe(204);

    const list = await agent.get(`/todos/${TEST_EMAIL}`);
    expect(list.status).toBe(200);
    expect(list.body.some(t => t.id === createdId)).toBe(false);
  });
});
