module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/functions/**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@libs/(.*)$': '<rootDir>/src/libs/$1'
  },
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/functions/**/*.ts',
    '!src/functions/**/__tests__/**'
  ]
};
