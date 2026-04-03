/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', { module: { type: 'es6' } }],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^w3name$': '<rootDir>/node_modules/w3name/dist/index.mjs',
    '^w3name/service$': '<rootDir>/node_modules/w3name/dist/service.mjs',
  },
  transformIgnorePatterns: ['node_modules/(?!(w3name)/)'],
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
};
