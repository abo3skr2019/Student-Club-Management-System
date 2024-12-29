module.exports = {
    testEnvironment: 'node',
    verbose: true,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    testPathIgnorePatterns: ['/node_modules/'],
    roots: ['<rootDir>/backend/tests'], // removed frontend/tests from roots since it is empty for now 
    setupFiles: ["dotenv/config"],
  };