import { APIGatewayProxyEvent } from 'aws-lambda';
import { checkin } from '../handler';
import pool from '@libs/database';

jest.mock('@libs/database');
jest.mock('@libs/queries');

describe('QR Check-in Handler', () => {
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

  describe('checkin', () => {
    it('should update attendance if eventHash is valid', async () => {
      connectionMock.execute.mockResolvedValue([[{ affectedRows: 1 }]]);

      const event: APIGatewayProxyEvent = {
        body: JSON.stringify({ eventHash: 'valid-event-hash' }),
        headers: {
          origin: 'http://localhost:3000'
        }
      } as any;

      const result = await checkin(event);

      expect(result.statusCode).toBe(201);
      expect(JSON.parse(result.body).message).toBe('User attendance taken successfully');
    });

    it('should return 400 if eventHash is missing', async () => {
      const event: APIGatewayProxyEvent = {
        body: JSON.stringify({}),
        headers: {
          origin: 'http://localhost:3000'
        }
      } as any;

      const result = await checkin(event);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).message).toBe('Event hash required');
    });

    it('should return 411 if attendance update fails', async () => {
      connectionMock.execute.mockResolvedValue([[{ affectedRows: 0 }]]);

      const event: APIGatewayProxyEvent = {
        body: JSON.stringify({ eventHash: 'invalid-event-hash' }),
        headers: {
          origin: 'http://localhost:3000'
        }
      } as any;

      const result = await checkin(event);

      expect(result.statusCode).toBe(411);
      expect(JSON.parse(result.body).message).toBe('User attendance update failed');
    });

    it('should return 500 on internal server error', async () => {
      connectionMock.execute.mockRejectedValue(new Error('Database error'));

      const event: APIGatewayProxyEvent = {
        body: JSON.stringify({ eventHash: 'valid-event-hash' }),
        headers: {
          origin: 'http://localhost:3000'
        }
      } as any;

      const result = await checkin(event);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).message).toContain('Internal server error');
    });
  });
}); 