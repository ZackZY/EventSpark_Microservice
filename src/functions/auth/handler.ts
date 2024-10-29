import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import pool from '@libs/database';
import { queries } from '@libs/queries';
import { User } from '@types/user';
import { v4 as uuidv4 } from 'uuid';

// In production, store these securely in AWS Secrets Manager
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SALT_ROUNDS = 10;

export const register = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const connection = await pool.getConnection();
  
  try {
    const { email, password } = JSON.parse(event.body || '{}');

    // Validate input
    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Email and password are required' })
      };
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid email format' })
      };
    }

    // Check if user exists
    const [existingUsers] = await connection.execute(queries.GET_USER_BY_EMAIL, [email]);
    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      return {
        statusCode: 409,
        body: JSON.stringify({ message: 'User already exists' })
      };
    }

    // Generate UUID for new user
    const userId = uuidv4();

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert new user with UUID
    await connection.execute(queries.INSERT_USER, [userId, email, hashedPassword, false]);

    return {
      statusCode: 201,
      body: JSON.stringify({ 
        message: 'User registered successfully',
        user: { id: userId, email }
      })
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  } finally {
    connection.release();
  }
};

export const login = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const connection = await pool.getConnection();
  
  try {
    const { email, password } = JSON.parse(event.body || '{}');

    // Validate input
    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Email and password are required' })
      };
    }

    // Get user
    const [users] = await connection.execute(queries.GET_USER_BY_EMAIL, [email]);
    const user = Array.isArray(users) && users[0] as User;

    if (!user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Invalid credentials' })
      };
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Invalid credentials' })
      };
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        isAdmin: user.isAdmin 
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        token,
        user: {
          id: user.id,
          email: user.email,
          isAdmin: user.isAdmin 
        }
      })
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  } finally {
    connection.release();
  }
};

export const verify = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const token = event.headers.Authorization?.replace('Bearer ', '');

    if (!token) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'No token provided' })
      };
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { 
      userId: number; 
      email: string;
      isAdmin: boolean; 
    };
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        valid: true, 
        user: {
          id: decoded.userId,
          email: decoded.email,
          isAdmin: decoded.isAdmin 
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 401,
      body: JSON.stringify({ valid: false, message: 'Invalid token' })
    };
  }
};
