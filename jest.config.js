module.exports = {
    testEnvironment: 'node',
    verbose: true,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    testPathIgnorePatterns: ['/node_modules/'],
    roots: ['<rootDir>/backend/tests', '<rootDir>/frontend/tests'],
    setupFiles: ["dotenv/config"],
  };