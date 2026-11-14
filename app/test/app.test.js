const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../src/app');

test('GET / returns service info', async () => {
  const res = await request(createApp()).get('/');
  assert.equal(res.status, 200);
  assert.equal(res.body.service, 'task-api');
});

test('health and readiness probes', async () => {
  const app = createApp();
  assert.equal((await request(app).get('/healthz')).status, 200);
  assert.equal((await request(app).get('/readyz')).status, 200);
  app.locals.setReady(false);
  assert.equal((await request(app).get('/readyz')).status, 503);
});

test('metrics endpoint exposes Prometheus metrics', async () => {
  const res = await request(createApp()).get('/metrics');
  assert.equal(res.status, 200);
  assert.match(res.text, /http_requests_total/);
});

test('task CRUD lifecycle', async () => {
  const app = createApp();

  const created = await request(app).post('/api/tasks').send({ title: 'Write Dockerfile' });
  assert.equal(created.status, 201);
  const id = created.body.id;

  const list = await request(app).get('/api/tasks');
  assert.equal(list.body.length, 1);

  const updated = await request(app).patch(`/api/tasks/${id}`).send({ done: true });
  assert.equal(updated.body.done, true);

  assert.equal((await request(app).delete(`/api/tasks/${id}`)).status, 204);
  assert.equal((await request(app).get(`/api/tasks/${id}`)).status, 404);
});

test('POST /api/tasks validates input', async () => {
  const res = await request(createApp()).post('/api/tasks').send({});
  assert.equal(res.status, 400);
});
