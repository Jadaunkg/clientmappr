/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    // Exclude files with no test coverage (external integration points)
    '!src/jobs/**',
    '!src/config/**',
  ],
  coveragePathIgnorePatterns: ['/node_modules/'],
  // Coverage thresholds for actively-tested modules
  coverageThreshold: {
    './src/validators/userValidators.js': { statements: 95, functions: 95 },
    './src/utils/AppError.js': { statements: 95, functions: 95 },
    './src/services/leads/queryBuilder.js': { statements: 90, functions: 90 },
  },
  testTimeout: 10000,
  verbose: true,
};

export default config;
