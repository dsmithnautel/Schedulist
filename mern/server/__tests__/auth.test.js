import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDB, disconnectDB } from '../db.js';
import app from '../server.js';
import User from '../models/User.js';

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await connectDB(mongoUri);
});

afterAll(async () => {
    await disconnectDB();
    await mongoServer.stop();
});

beforeEach(async () => {
    await User.deleteMany({});
});


describe('Auth Routes', () => {
    describe('POST /api/auth/signup', () => {
        it('should create a new user and return token', async () => {
            const response = await request(app)
                .post('/api/auth/signup')
                .send({
                    username: 'testuser',
                    password: 'Test123!@#'
                });

            expect(response.statusCode).toBe(201);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.username).toBe('testuser');
        });

        it('should validate password requirements', async () => {
            const response = await request(app)
                .post('/api/auth/signup')
                .send({
                    username: 'testuser',
                    password: 'weak'
                });

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('errors');
        });

        it('should prevent duplicate usernames', async () => {
            // First create a user
            await request(app)
                .post('/api/auth/signup')
                .send({
                    username: 'testuser',
                    password: 'Test123!@#'
                });

            // Try to create another user with the same username
            const response = await request(app)
                .post('/api/auth/signup')
                .send({
                    username: 'testuser',
                    password: 'Test123!@#'
                });

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('message', 'Username already exists');
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            await request(app)
                .post('/api/auth/signup')
                .send({
                    username: 'testuser',
                    password: 'Test123!@#'
                });
        });

        it('should login existing user and return token', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'testuser',
                    password: 'Test123!@#'
                });

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body.user.username).toBe('testuser');
        });

        it('should reject invalid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'testuser',
                    password: 'wrongpass'
                });

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('message', 'Invalid credentials');
        });

        it('should require both username and password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'testuser'
                });

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('message', 'Username and password are required');
        });
    });
});