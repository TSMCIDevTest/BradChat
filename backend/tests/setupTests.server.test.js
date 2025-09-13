/**
 * Testing library/framework: Jest (unit tests for Express server bootstrap).
 * Rationale:
 *  - We mock Express and side-effectful modules to assert wiring without binding sockets.
 *  - Supertest is not used here because the file immediately calls app.listen on import.
 *    Instead, we validate interactions via Jest mocks.
 */

jest.mock('dotenv', () => ({ config: jest.fn() }));
jest.mock('path', () => {
  // Provide minimal path.resolve/join behavior needed for assertions
  const path = jest.requireActual('path');
  return {
    ...path,
    resolve: jest.fn(() => '/abs/root'),
    join: jest.fn((...args) => args.join('/')),
  };
});

// Mocks for external modules referenced by the server
const mockUse = jest.fn();
const mockGet = jest.fn();
const mockListen = jest.fn((_port, cb) => cb && cb());
const mockJson = jest.fn(() => 'json-mw');

const mockExpressApp = {
  use: mockUse,
  get: mockGet,
  listen: mockListen,
};
const mockExpress = jest.fn(() => mockExpressApp);
mockExpress.json = jest.fn(() => mockJson());

jest.mock('express', () => {
  const m = () => mockExpress();
  m.json = jest.fn(() => 'json-mw');
  return m;
});

const mockConnectDB = jest.fn();
jest.mock('../lib/db.js', () => ({
  connectDB: (...args) => mockConnectDB(...args),
}));

// Route modules are functions/middleware; we don't need their internals
const authRoutes = jest.fn((_req, _res, next) => next && next());
const messageRoutes = jest.fn((_req, _res, next) => next && next());
jest.mock('../routes/auth.route.js', () => ({
  __esModule: true,
  default: jest.fn(() => 'authRoutes'),
}));
jest.mock('../routes/message.route.js', () => ({
  __esModule: true,
  default: jest.fn(() => 'messageRoutes'),
}));

// Helper to load the module under a fresh environment and cleared module cache
const loadServerFresh = (env = {}) => {
  jest.resetModules();

  // restore our manual mocks after reset
  jest.doMock('express', () => {
    const m = () => mockExpress();
    m.json = jest.fn(() => 'json-mw');
    return m;
  });
  jest.doMock('dotenv', () => ({ config: jest.fn() }));
  jest.doMock('path', () => {
    const path = jest.requireActual('path');
    return {
      ...path,
      resolve: jest.fn(() => '/abs/root'),
      join: jest.fn((...args) => args.join('/')),
    };
  });
  jest.doMock('../lib/db.js', () => ({ connectDB: (...a) => mockConnectDB(...a) }));
  jest.doMock('../routes/auth.route.js', () => ({ __esModule: true, default: jest.fn(() => 'authRoutes') }));
  jest.doMock('../routes/message.route.js', () => ({ __esModule: true, default: jest.fn(() => 'messageRoutes') }));

  // Apply env
  const original = process.env;
  process.env = { ...original, ...env };

  // Clear spies
  mockUse.mockClear();
  mockGet.mockClear();
  mockListen.mockClear();
  mockJson.mockClear();
  mockConnectDB.mockClear();

  // Import target (side-effect module)
  // IMPORTANT: path relative to this test file; original file is backend/tests/setupTests.js
  return require('./setupTests.js');
};

describe('server bootstrap (backend/tests/setupTests.js)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('initializes express app, JSON middleware, mounts routes, listens on default port (3000), and connects DB', () => {
    loadServerFresh({ NODE_ENV: 'development' });

    // express() called to create app
    expect(mockExpress).toHaveBeenCalledTimes(1);

    // JSON middleware applied
    expect(mockExpress.json).toHaveBeenCalledTimes(1);
    expect(mockUse).toHaveBeenCalledWith('json-mw');

    // Route mounting
    // Since our route mocks return strings, we assert the path and that some handler was passed
    expect(mockUse).toHaveBeenCalledWith('/api/auth', expect.anything());
    expect(mockUse).toHaveBeenCalledWith('/api/messages', expect.anything());

    // Production-specific static middleware should NOT be registered in development
    const staticUseCalls = mockUse.mock.calls.filter((args) => {
      const [firstArg] = args;
      return typeof firstArg === 'function' && firstArg.name === 'serveStatic';
    });
    expect(staticUseCalls.length).toBe(0);

    // listen called with default port 3000
    expect(mockListen).toHaveBeenCalledTimes(1);
    expect(mockListen.mock.calls[0][0]).toBe(3000);

    // connectDB called within the listen callback
    expect(mockConnectDB).toHaveBeenCalledTimes(1);
  });

  test('respects PORT from environment', () => {
    loadServerFresh({ NODE_ENV: 'development', PORT: '5555' });
    expect(mockListen).toHaveBeenCalledWith(5555, expect.any(Function));
  });

  test('in production, serves static dist and catch-all index.html route', () => {
    const mod = loadServerFresh({ NODE_ENV: 'production' });

    // Static middleware should be registered
    // The first production-specific .use call registers static middleware
    const staticCall = mockUse.mock.calls.find((args) => args.length === 1 && typeof args[0] !== 'string');
    expect(staticCall).toBeTruthy();

    // Catch-all GET route exists
    const catchAll = mockGet.mock.calls.find((args) => args[0] === '*');
    expect(catchAll).toBeTruthy();
    expect(typeof catchAll[1]).toBe('function');
  });

  test('handles missing NODE_ENV gracefully (defaults to non-production path)', () => {
    loadServerFresh({ NODE_ENV: '' });
    // Should not register production-specific get('*')
    const hasCatchAll = mockGet.mock.calls.some((args) => args[0] === '*');
    expect(hasCatchAll).toBe(false);
  });

  test('logs server start without throwing (listen callback executes)', () => {
    expect(() => loadServerFresh({})).not.toThrow();
    // Ensure listen callback executed because connectDB was called
    expect(mockConnectDB).toHaveBeenCalled();
  });
});