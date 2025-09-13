/** Fallback Jest config: adjust if project already has a config elsewhere. */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/backend/tests/**/*.test.js'],
  moduleFileExtensions: ['js', 'jsx', 'json'],
  transform: {},
};