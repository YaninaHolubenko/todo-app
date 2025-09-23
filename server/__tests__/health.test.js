// server/__tests__/health.test.js
const request = require('supertest');
const app = require('../server');

describe('healthcheck', () => {
  it('GET /health -> { ok: true }', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
