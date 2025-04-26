module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  roots: ['<rootDir>/backend/tests'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  testPathIgnorePatterns: ['/node_modules/'],
  setupFiles: ['dotenv/config'],
};