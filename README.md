# EventSpark Microservice

A serverless backend service built with AWS Lambda, Node.js, and TypeScript.

## Prerequisites

- NodeJS `>=20`
- AWS CLI configured with appropriate credentials
- If using nvm, run `nvm use` to ensure correct Node version

## Installation

### Using NPM

1. Install dependencies:
   ```bash
   npm install
   ```

2. Local Development:
   ```bash
   npm run dev        # Runs on http://localhost:4000
   ```

3. Deploy to AWS:
   ```bash
   npm run deploy
   ```

## Project Structure
.
├── src
│   ├── functions                    # Lambda functions
│   │   ├── auth                     # Authentication functions
│   │   │   ├── handler.ts           # Auth logic (login, register, verify)
│   │   │   └── index.ts             # Function configuration
│   │   └── index.ts                 # Functions export
│   ├── libs                         # Shared code
│   │   ├── cookie.ts                # Cookie management
│   │   ├── database.ts              # Database connection
│   │   └── queries.ts               # SQL queries
├── package.json                     # Project dependencies
├── serverless.ts                    # Serverless configuration
└── tsconfig.json                    # TypeScript configuration


## Features

- User Authentication (Register, Login, Logout)
- JWT-based token management
- Secure cookie handling
- CORS support
- Local development environment
- MySQL database integration

## API Endpoints

### Authentication

#### Register
- **POST** `/auth/register`
- Body: `{ "email": "user@example.com", "password": "password" }`
- Returns:
  - 201: User registered successfully
  - 400: Email and password are required
  - 400: Invalid email format
  - 409: User already exists
  - 500: Internal server error

#### Login
- **POST** `/auth/login`
- Body: `{ "email": "user@example.com", "password": "password" }`
- Returns:
  - 200: Successful login with user details and JWT token in cookies
  - 400: Email and password are required
  - 401: Invalid credentials
  - 500: Internal server error

#### Logout
- **POST** `/auth/logout`
- Returns:
  - 200: Logged out successfully

#### Verify Token
- **GET** `/auth/verify`
- Returns:
  - 200: Valid token with user details
  - 401: No token provided or invalid token

### QR Check-in

#### Check-in User
- **POST** `/qrcheckin`
- Body: `{ "eventHash": "string" }`
- Returns:
  - 201: User attendance taken successfully
  - 400: Event hash required
  - 411: User attendance update failed
  - 500: Internal server error

Response example (success):
```json
{
  "statusCode": "201",
  "message": "User attendance taken successfully"
}
```

## Security Features

- HTTP-only cookies
- CORS protection
- JWT authentication
- Password hashing with bcrypt
- SameSite cookie policy
- Secure cookie flags in production

## Environment Variables

Create a `.env` file with:

```env
JWT_SECRET=your_jwt_secret
COOKIE_DOMAIN=your_domain
FRONTEND_URL=your_frontend_url
IS_OFFLINE=true  # For local development
```

## Dependencies

Key packages used:
- `@middy/core` - Middleware engine
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT handling
- `mysql2` - Database connectivity
- `serverless` - Framework for AWS Lambda deployment

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=ZackZY_EventSpark_Microservice&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=ZackZY_EventSpark_Microservice)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=ZackZY_EventSpark_Microservice&metric=coverage)](https://sonarcloud.io/summary/new_code?id=ZackZY_EventSpark_Microservice)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=ZackZY_EventSpark_Microservice&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=ZackZY_EventSpark_Microservice)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=ZackZY_EventSpark_Microservice&metric=bugs)](https://sonarcloud.io/summary/new_code?id=ZackZY_EventSpark_Microservice)

