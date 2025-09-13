Testing framework: Jest (Node + Express unit tests)
- These tests mock Express and other side-effectful modules to validate server wiring.
- Primary subject: backend/tests/setupTests.js (server bootstrap).
Run (example):
  npm test
or, if backend has its own package.json:
  npm --prefix backend test

Adjust jest.config.js if your repository maintains test config elsewhere.