module.exports = {
  testEnvironment: 'jsdom',
  // Only run unit tests via Jest; e2e tests use Playwright via `npm run test:e2e`
  testMatch: ['**/tests/unit/**/*.{test,spec}.{js,jsx}'],
  testPathIgnorePatterns: ['/node_modules/', '/tests/e2e/'],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  moduleFileExtensions: ['js', 'jsx', 'json'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
  ],
};
