import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import User from '../models/User.js';
import Task from '../models/Task.js';
import path from 'path';
import fs from 'fs/promises';

let mongoServer;
let userToken;
let adminToken;
let testUser;
let testAdmin;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Create test users
  testUser = await User.create({
    email: 'user@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    role: 'user'
  });

  testAdmin = await User.create({
    email: 'admin@example.com',
    password: 'password123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin'
  });

  // Get tokens
  const userRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'user@example.com',
      password: 'password123'
    });
  userToken = userRes.body.token;

  const adminRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'admin@example.com',
      password: 'password123'
    });
  adminToken = adminRes.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Task.deleteMany({});
});

describe('Task Management Endpoints', () => {
  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .field('title', 'Test Task')
        .field('description', 'Test Description')
        .field('status', 'todo')
        .field('priority', 'medium')
        .field('dueDate', new Date().toISOString())
        .field('assignedTo', testUser._id.toString());

      expect(res.statusCode).toBe(201);
      expect(res.body.title).toBe('Test Task');
      expect(res.body.assignedTo).toBe(testUser._id.toString());
    });

    it('should create a task with attachments', async () => {
      // Create a temporary PDF file
      const tempFilePath = path.join(__dirname, 'test.pdf');
      await fs.writeFile(tempFilePath, 'Test PDF content');

      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .field('title', 'Test Task with Attachment')
        .field('description', 'Test Description')
        .field('status', 'todo')
        .field('priority', 'medium')
        .field('dueDate', new Date().toISOString())
        .field('assignedTo', testUser._id.toString())
        .attach('attachments', tempFilePath);

      expect(res.statusCode).toBe(201);
      expect(res.body.attachments).toHaveLength(1);
      expect(res.body.attachments[0].mimetype).toBe('application/pdf');

      // Clean up
      await fs.unlink(tempFilePath);
    });
  });

  describe('GET /api/tasks', () => {
    beforeEach(async () => {
      // Create some test tasks
      await Task.create([
        {
          title: 'Task 1',
          description: 'Description 1',
          status: 'todo',
          priority: 'high',
          dueDate: new Date(),
          assignedTo: testUser._id,
          createdBy: testUser._id
        },
        {
          title: 'Task 2',
          description: 'Description 2',
          status: 'in_progress',
          priority: 'medium',
          dueDate: new Date(),
          assignedTo: testUser._id,
          createdBy: testAdmin._id
        }
      ]);
    });

    it('should get all tasks for admin', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.tasks).toHaveLength(2);
    });

    it('should filter tasks by status', async () => {
      const res = await request(app)
        .get('/api/tasks?status=todo')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.tasks).toHaveLength(1);
      expect(res.body.tasks[0].status).toBe('todo');
    });

    it('should filter tasks by priority', async () => {
      const res = await request(app)
        .get('/api/tasks?priority=high')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.tasks).toHaveLength(1);
      expect(res.body.tasks[0].priority).toBe('high');
    });
  });

  describe('PUT /api/tasks/:id', () => {
    let taskId;

    beforeEach(async () => {
      const task = await Task.create({
        title: 'Test Task',
        description: 'Test Description',
        status: 'todo',
        priority: 'medium',
        dueDate: new Date(),
        assignedTo: testUser._id,
        createdBy: testUser._id
      });
      taskId = task._id;
    });

    it('should update a task', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Updated Task',
          status: 'in_progress'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe('Updated Task');
      expect(res.body.status).toBe('in_progress');
    });

    it('should not update a task without authorization', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send({
          title: 'Updated Task'
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    let taskId;

    beforeEach(async () => {
      const task = await Task.create({
        title: 'Test Task',
        description: 'Test Description',
        status: 'todo',
        priority: 'medium',
        dueDate: new Date(),
        assignedTo: testUser._id,
        createdBy: testUser._id
      });
      taskId = task._id;
    });

    it('should delete a task', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Task removed');

      const task = await Task.findById(taskId);
      expect(task).toBeNull();
    });

    it('should not delete a task without authorization', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${taskId}`);

      expect(res.statusCode).toBe(401);
    });
  });
}); 