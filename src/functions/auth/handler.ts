import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import pool from '@libs/database';
import { queries } from '@libs/queries';
import { User } from '@types/user';
import { v4 as uuidv4 } from 'uuid';
import { getCookieString, getClearCookieString, getCorsHeaders } from '@libs/cookie';

// In production, store these securely in AWS Secrets Manager
const JWT_SECRET = process.env.JWT_SECRET || '8a9102f052cae2dfd3a5115837ac0bcc667c1bb8c1a297f9b3045329473b031e';
const SALT_ROUNDS = 10;

export const register = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const connection = await pool.getConnection();
  
  try {
    const { email, password } = JSON.parse(event.body || '{}');

    // Validate input
    if (!email || !password) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(event.headers.origin),
        body: JSON.stringify({ message: 'Email and password are required' })
      };
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(event.headers.origin),
        body: JSON.stringify({ message: 'Invalid email format' })
      };
    }

    // Check if user exists
    const [existingUsers] = await connection.execute(queries.GET_USER_BY_EMAIL, [email]);
    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      return {
        statusCode: 409,
        headers: getCorsHeaders(event.headers.origin),
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
        headers: getCorsHeaders(event.headers.origin),
        user: { id: userId, email }
      })
    };
  } catch (error) {
    console.log("REGISTER status code 500: " + error);
    return {
      statusCode: 500,
      headers: getCorsHeaders(event.headers.origin),
      body: JSON.stringify({ message: 'Internal server error' })
    };
  } finally {
    connection.release();
  }
};

export const login = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const connection = await pool.getConnection();
  const isOffline = process.env.IS_OFFLINE === 'true'
  
  try {
    const { email, password } = JSON.parse(event.body || '{}');

    // Validate input
    if (!email || !password) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(event.headers.origin, isOffline),
        body: JSON.stringify({ message: 'Email and password are required' })
      };
    }

    // Get user
    const [users] = await connection.execute(queries.GET_USER_BY_EMAIL, [email]);
    const user = Array.isArray(users) && users[0] as User;

    if (!user) {
      return {
        statusCode: 401,
        headers: getCorsHeaders(event.headers.origin, isOffline),
        body: JSON.stringify({ message: 'Invalid credentials' })
      };
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return {
        statusCode: 401,
        headers: getCorsHeaders(event.headers.origin,isOffline),
        body: JSON.stringify({ message: 'Invalid credentials' })
      };
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin 
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const cookieString = getCookieString({
      token,
      isOffline
    });

    return {
      statusCode: 200,
      headers: {
        'Set-Cookie': cookieString,
        ...getCorsHeaders(event.headers.origin, isOffline)
      },
      body: JSON.stringify({ 
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin 
        }
      })
    };
  } catch (error) {
    console.log("LOGIN status code 500: " + error);
    return {
      statusCode: 500,
      headers: getCorsHeaders(event.headers.origin,isOffline),
      body: JSON.stringify({ message: 'Internal server error' })
    };
  } finally {
    connection.release();
  }
};

// Add a logout function to clear the cookie
export const logout = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const isOffline = process.env.IS_OFFLINE === 'true'

  return {
    statusCode: 200,
    headers: {
      'Set-Cookie': getClearCookieString({ isOffline }),
      ...getCorsHeaders(event.headers.origin, isOffline)
    },
    body: JSON.stringify({ success: true, message: 'Logged out successfully' })
  };
};

export const verify = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // First try to get token from cookies
    let token: string | undefined;

    if (event.headers.Cookie) {
      const cookies = event.headers.Cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as { [key: string]: string });
      
      token = cookies.token;
    }

    // Fallback to Authorization header if no cookie
    if (!token && event.headers.Authorization) {
      token = event.headers.Authorization.replace('Bearer ', '');
    }

    if (!token) {
      return {
        statusCode: 401,
        headers: getCorsHeaders(event.headers.origin),
        body: JSON.stringify({ message: 'No token provided' })
      };
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { 
      userId: string; // Changed from number to string since we're using UUID
      email: string;
      name: string;
      isAdmin: boolean; 
    };
    
    return {
      statusCode: 200,
      headers: getCorsHeaders(event.headers.origin),
      body: JSON.stringify({ 
        valid: true, 
        user: {
          id: decoded.userId,
          email: decoded.email,
          name: decoded.name,
          isAdmin: decoded.isAdmin 
        }
      })
    };
  } catch (error) {
    console.log("VERIFY status code 500: " + error);
    return {
      statusCode: 401,
      headers: getCorsHeaders(event.headers.origin),
      body: JSON.stringify({ valid: false, message: 'Invalid token' })
    };
  }
};

// You might also want to create a reusable middleware for auth verification
// export const verifyToken = (token: string) => {
//   try {
//     const decoded = jwt.verify(token, JWT_SECRET) as { 
//       userId: string;
//       email: string;
//       isAdmin: boolean; 
//     };
//     return { valid: true, user: decoded };
//   } catch (error) {
//     return { valid: false, error: 'Invalid token' };
//   }
// };
