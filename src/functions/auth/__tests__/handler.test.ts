import { APIGatewayProxyEvent } from 'aws-lambda';
import { register, login, logout, verify } from '../handler';
import pool from '@libs/database';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';

jest.mock('@libs/database');
jest.mock('@libs/queries');
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');

describe('Auth Handlers', () => {
  let connectionMock: any;

  beforeEach(() => {
    connectionMock = {
      execute: jest.fn(),
      release: jest.fn(),
    };
    (pool.getConnection as jest.Mock).mockResolvedValue(connectionMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      connectionMock.execute.mockResolvedValue([[]]);

      const event: APIGatewayProxyEvent = {
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
        headers: {
          origin: 'http://localhost:3000'
        }
      } as any;

      const result = await register(event);

      expect(result.statusCode).toBe(201);
      expect(JSON.parse(result.body).message).toBe('User registered successfully');
    });

    it('should return 400 if email or password is missing', async () => {
      const event: APIGatewayProxyEvent = {
        body: JSON.stringify({ email: '' }),
        headers: {
          origin: 'http://localhost:3000'
        }
      } as any;

      const result = await register(event);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).message).toBe('Email and password are required');
    });
  });

  describe('login', () => {
    it('should login a user and return a token', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      connectionMock.execute.mockResolvedValue([[{ id: '1', email: 'test@example.com', password: hashedPassword }]]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('fake-jwt-token');

      const event: APIGatewayProxyEvent = {
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
        headers: {
          origin: 'http://localhost:3000'
        }
      } as any;

      const result = await login(event);

      expect(result.statusCode).toBe(200);
      expect(result.headers['Set-Cookie']).toContain('fake-jwt-token');
    });

    it('should return 401 if credentials are invalid', async () => {
      connectionMock.execute.mockResolvedValue([[]]);

      const event: APIGatewayProxyEvent = {
        body: JSON.stringify({ email: 'test@example.com', password: 'wrongpassword' }),
        headers: {
          origin: 'http://localhost:3000'
        }
      } as any;

      const result = await login(event);

      expect(result.statusCode).toBe(401);
      expect(JSON.parse(result.body).message).toBe('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should clear the cookie on logout', async () => {
      const event: APIGatewayProxyEvent = {
        headers: {
          origin: 'http://localhost:3000'
        }
      } as any;

      const result = await logout(event);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body).message).toBe('Logged out successfully');
    });
  });

  describe('verify', () => {
    it('should verify a valid token', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({
        userId: '1',
        email: 'test@example.com',
        name: 'Test User',
        isAdmin: false,
      });

      const event: APIGatewayProxyEvent = {
        headers: { Cookie: 'token=fake-jwt-token' },
      } as any;

      const result = await verify(event);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body).valid).toBe(true);
    });

    it('should return 401 if token is invalid', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const event: APIGatewayProxyEvent = {
        headers: { Cookie: 'token=invalid-token' },
      } as any;

      const result = await verify(event);

      expect(result.statusCode).toBe(401);
      expect(JSON.parse(result.body).valid).toBe(false);
    });
  });
}); 