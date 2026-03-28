const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../../src/app');

let mongoServer;
let token;
let userId;

const registerAndLogin = async () => {
  const res = await request(app).post('/api/auth/register')
    .send({ name: 'Task User', email: 'tasks@example.com', password: 'password123' });
  token = res.body.data.token;
  userId = res.body.data.user._id;
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
  await registerAndLogin();
});

const auth = () => ({ Authorization: `Bearer ${token}` });

describe('POST /api/tasks', () => {
  it('creates a task successfully', async () => {
    const res = await request(app).post('/api/tasks')
      .set(auth())
      .send({ title: 'My First Task', description: 'Do the thing', priority: 'high' });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.title).toBe('My First Task');
    expect(res.body.data.status).toBe('todo');
    expect(res.body.data.priority).toBe('high');
    expect(res.body.data.createdBy).toBe(userId);
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app).post('/api/tasks').set(auth()).send({ description: 'No title' });
    expect(res.statusCode).toBe(400);
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'Unauthorized' });
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/tasks', () => {
  beforeEach(async () => {
    await Promise.all([
      request(app).post('/api/tasks').set(auth()).send({ title: 'Task A', status: 'todo' }),
      request(app).post('/api/tasks').set(auth()).send({ title: 'Task B', status: 'in-progress' }),
      request(app).post('/api/tasks').set(auth()).send({ title: 'Task C', status: 'done' }),
    ]);
  });

  it('returns all tasks with pagination', async () => {
    const res = await request(app).get('/api/tasks').set(auth());
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBe(3);
  });

  it('filters by status', async () => {
    const res = await request(app).get('/api/tasks?status=todo').set(auth());
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].status).toBe('todo');
  });

  it('respects pagination params', async () => {
    const res = await request(app).get('/api/tasks?page=1&limit=2').set(auth());
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination.hasNext).toBe(true);
  });
});

describe('GET /api/tasks/:id', () => {
  let taskId;

  beforeEach(async () => {
    const res = await request(app).post('/api/tasks').set(auth()).send({ title: 'Fetch Me' });
    taskId = res.body.data._id;
  });

  it('returns a task by ID', async () => {
    const res = await request(app).get(`/api/tasks/${taskId}`).set(auth());
    expect(res.statusCode).toBe(200);
    expect(res.body.data._id).toBe(taskId);
  });

  it('returns 404 for non-existent task', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/tasks/${fakeId}`).set(auth());
    expect(res.statusCode).toBe(404);
  });

  it('returns 400 for invalid ID format', async () => {
    const res = await request(app).get('/api/tasks/not-a-valid-id').set(auth());
    expect(res.statusCode).toBe(400);
  });
});

describe('PATCH /api/tasks/:id', () => {
  let taskId;

  beforeEach(async () => {
    const res = await request(app).post('/api/tasks').set(auth()).send({ title: 'Update Me' });
    taskId = res.body.data._id;
  });

  it('updates task status', async () => {
    const res = await request(app).patch(`/api/tasks/${taskId}`)
      .set(auth()).send({ status: 'in-progress' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('in-progress');
  });

  it('returns 400 for invalid status', async () => {
    const res = await request(app).patch(`/api/tasks/${taskId}`)
      .set(auth()).send({ status: 'invalid-status' });
    expect(res.statusCode).toBe(400);
  });
});

describe('DELETE /api/tasks/:id', () => {
  let taskId;

  beforeEach(async () => {
    const res = await request(app).post('/api/tasks').set(auth()).send({ title: 'Delete Me' });
    taskId = res.body.data._id;
  });

  it('deletes a task', async () => {
    const del = await request(app).delete(`/api/tasks/${taskId}`).set(auth());
    expect(del.statusCode).toBe(200);
    const get = await request(app).get(`/api/tasks/${taskId}`).set(auth());
    expect(get.statusCode).toBe(404);
  });
});

describe('GET /api/tasks/stats', () => {
  beforeEach(async () => {
    await Promise.all([
      request(app).post('/api/tasks').set(auth()).send({ title: 'T1', status: 'todo' }),
      request(app).post('/api/tasks').set(auth()).send({ title: 'T2', status: 'todo' }),
      request(app).post('/api/tasks').set(auth()).send({ title: 'T3', status: 'done' }),
    ]);
  });

  it('returns correct task counts', async () => {
    const res = await request(app).get('/api/tasks/stats').set(auth());
    expect(res.statusCode).toBe(200);
    expect(res.body.data.todo).toBe(2);
    expect(res.body.data.done).toBe(1);
    expect(res.body.data.total).toBe(3);
  });
});
