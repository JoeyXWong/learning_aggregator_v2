module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/**/*.test.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,     // actual: 74.4%
      functions: 90,    // actual: 95.36%
      lines: 90,        // actual: 91.28%
      statements: 90,   // actual: 91.52%
    },
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  verbose: true,
};
