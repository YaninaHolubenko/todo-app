// server/__tests__/auth.test.js
const request = require('supertest');

// Mock the DB layer so tests don't require a real Postgres
jest.mock('../db', () => {
  const users = new Map(); // email -> { email, hashed_password }
  return {
    __users: users,
    // Minimal SQL router that supports queries used by authController
    query: async (sql, params) => {
      const text = String(sql).toLowerCase();

      // INSERT INTO users (email, hashed_password) VALUES ($1, $2)
      if (text.includes('insert into users') && text.includes('(email, hashed_password)')) {
        const [email, hashed_password] = params;
        if (users.has(email)) {
          const err = new Error('duplicate key value violates unique constraint');
          err.code = '23505';
          throw err;
        }
        users.set(email, { email, hashed_password });
        return { rows: [], rowCount: 1 };
      }

      // SELECT * FROM users WHERE email = $1
      if (text.includes('select * from users where email = $1')) {
        const [email] = params;
        const row = users.get(email);
        return row ? { rows: [row], rowCount: 1 } : { rows: [], rowCount: 0 };
      }

      // DELETE FROM users WHERE email = $1 (not strictly needed here, but useful)
      if (text.includes('delete from users where email = $1')) {
        const [email] = params;
        const existed = users.delete(email);
        return { rows: [], rowCount: existed ? 1 : 0 };
      }

      // pass-through default
      return { rows: [], rowCount: 0 };
    },
    end: async () => {},
  };
});

const app = require('../server');

const TEST_EMAIL = 'test@example.com';
const TEST_PASS = 'secret123';

beforeAll(() => {
  // Ensure JWT secret for the controller
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
});

describe('auth flow (DB mocked)', () => {
  it('POST /signup creates a new user or returns conflict if exists', async () => {
    const res = await request(app)
      .post('/signup')
      .send({ email: TEST_EMAIL, password: TEST_PASS });

    expect([204, 409]).toContain(res.status);
    if (res.status === 204) {
      expect(res.headers['set-cookie']).toBeDefined();
    }
  });

  it('POST /login authenticates an existing user', async () => {
    // ensure the user exists (call signup; ignore if 409)
    await request(app).post('/signup').send({ email: TEST_EMAIL, password: TEST_PASS });

    const res = await request(app)
      .post('/login')
      .send({ email: TEST_EMAIL, password: TEST_PASS });

    expect(res.status).toBe(204);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('GET /me returns current user when authenticated', async () => {
    const agent = request.agent(app);

    await agent
      .post('/login')
      .send({ email: TEST_EMAIL, password: TEST_PASS });

    const res = await agent.get('/me');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ email: TEST_EMAIL });
  });
});
