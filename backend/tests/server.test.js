/**
 * Tests for server bootstrap behavior.
 *
 * Framework: Jest (module mocking + spies).
 * If the project uses Vitest, replace jest.fn/jest.mock with vi.fn/vi.mock accordingly.
 *
 * We avoid binding to a real port by mocking the 'express' module to return
 * a fake app object with spy-able methods. We also mock connectDB and route modules.
 */

const ORIGINAL_ENV = process.env;

// Build a minimal fake Express app surface used by server code.
function createFakeApp() {
  const calls = {
    use: [],
    get: [],
    listen: [],
    json: [],
    static: [],
  };
  const app = {
    use: jest.fn((...args) => { calls.use.push(args); }),
    get: jest.fn((...args) => { calls.get.push(args); }),
    listen: jest.fn((port, cb) => { calls.listen.push([port, cb]); if (typeof cb === 'function') cb(); return { close: jest.fn() }; }),
  };
  // express.json() and express.static() are functions on the express export
  // but in our tests we return sentinel middlewares to track usage.
  const jsonMiddleware = { name: "json-mw" };
  const staticMiddleware = { name: "static-mw" };

  return { app, calls, jsonMiddleware, staticMiddleware };
}

describe("server bootstrap", () => {
  let fake, mockedExpress;

  // Module mocks must be declared before requiring the module under test.
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV }; // clone
    // default env
    delete process.env.NODE_ENV;
    delete process.env.PORT;

    fake = createFakeApp();

    // Mock express to return our fake app and provide json/static creators.
    mockedExpress = Object.assign(jest.fn(() => fake.app), {
      json: jest.fn(() => fake.jsonMiddleware),
      static: jest.fn(() => fake.staticMiddleware),
    });
    jest.doMock('express', () => mockedExpress);

    // Stub dotenv.config to avoid reading real env files.
    jest.doMock('dotenv', () => ({ default: { config: jest.fn() } }));

    // Mock path but passthrough real implementation so we can spy on calls.
    const realPath = jest.requireActual('path');
    const resolveSpy = jest.fn(realPath.resolve);
    const joinSpy = jest.fn(realPath.join);
    jest.doMock('path', () => ({
      __esModule: true,
      default: {
        ...realPath,
      },
      // Named imports in ESM default to these
      resolve: resolveSpy,
      join: joinSpy,
      // Common usage through import path from 'path'
      ...realPath,
    }));

    // Mock route modules as identifiable sentinels.
    jest.doMock('./routes/auth.route.js', () => ({ __esModule: true, default: 'AUTH_ROUTER' }));
    jest.doMock('./routes/message.route.js', () => ({ __esModule: true, default: 'MESSAGE_ROUTER' }));

    // Mock connectDB to avoid real DB calls.
    const connectDB = jest.fn();
    jest.doMock('./lib/db.js', () => ({ connectDB }));
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    jest.clearAllMocks();
    jest.resetModules();
  });

  test("initializes express and applies JSON middleware and route mounts", async () => {
    // Arrange
    // Act
    await import('../server.js').catch(()=>{}); // adjust path if server file is elsewhere

    // Assert
    // express() was called to create app
    expect(mockedExpress).toHaveBeenCalledTimes(1);

    // express.json() added once
    expect(mockedExpress.json).toHaveBeenCalledTimes(1);
    expect(fake.app.use).toHaveBeenCalledWith(fake.jsonMiddleware);

    // Route mounts with correct prefixes
    // We mocked routers as strings, so verify those exact values.
    const uses = fake.app.use.mock.calls;
    const mountPaths = uses.map(args => args[0]);
    const middlewares = uses.map(args => args[1]);

    // There should be mounts for '/api/auth' and '/api/messages'
    const authIndex = mountPaths.indexOf("/api/auth");
    const msgIndex = mountPaths.indexOf("/api/messages");
    expect(authIndex).toBeGreaterThanOrEqual(0);
    expect(msgIndex).toBeGreaterThanOrEqual(0);
    expect(middlewares[authIndex]).toBe("AUTH_ROUTER");
    expect(middlewares[msgIndex]).toBe("MESSAGE_ROUTER");
  });

  test("starts server on default port 3000 and triggers connectDB in listen callback", async () => {
    // Arrange
    delete process.env.PORT;

    // Access the mocked db module to assert later.
    const dbMod = await import('../lib/db.js').catch(()=>({ connectDB: undefined }));

    // Act
    await import('../server.js').catch(()=>{});

    // Assert listen called with default 3000
    expect(fake.app.listen).toHaveBeenCalledTimes(1);
    const [port] = fake.app.listen.mock.calls[0];
    expect(port).toBe(3000);

    // connectDB should be invoked inside listen callback
    // We have to re-import because we mocked it above
    const { connectDB } = await import('../lib/db.js').catch(()=>({ connectDB: undefined }));
    expect(connectDB).toBeDefined();
    expect(connectDB).toHaveBeenCalledTimes(1);
  });

  test("respects PORT from env", async () => {
    process.env.PORT = "5555";
    await import('../server.js').catch(()=>{});
    expect(fake.app.listen).toHaveBeenCalledWith(5555, expect.any(Function));
  });

  test("production mode: serves static assets and wildcard route is registered", async () => {
    process.env.NODE_ENV = "production";

    // We need the mocked path to assert calls (the mock wraps real implementation)
    const pathMod = await import('path');

    await import('../server.js').catch(()=>{});

    // express.static is configured with path.join(__dirname, "../frontend/dist")
    expect(mockedExpress.static).toHaveBeenCalledTimes(1);
    expect(pathMod.join).toHaveBeenCalledWith(expect.any(String), "../frontend/dist");
    // static middleware mounted
    expect(fake.app.use).toHaveBeenCalledWith(fake.staticMiddleware);

    // "*" catch-all route registered
    expect(fake.app.get).toHaveBeenCalled();
    const starRouteCall = fake.app.get.mock.calls.find(args => args[0] === "*");
    expect(starRouteCall).toBeDefined();

    // Invoke the handler and ensure res.sendFile is called with some resolved path
    const handler = starRouteCall[1];
    const res = { sendFile: jest.fn() };
    handler({}, res);

    expect(res.sendFile).toHaveBeenCalledTimes(1);
    // Assert resolve called with specific args from source code:
    // path.resolve(__dirname, "../frontend", "/dist/", "index.html")
    expect(pathMod.resolve).toHaveBeenCalledWith(expect.any(String), "../frontend", "/dist/", "index.html");
    expect(typeof res.sendFile.mock.calls[0][0]).toBe("string");
  });

  test("non-production mode: does not mount static or wildcard route", async () => {
    process.env.NODE_ENV = "development";

    await import('../server.js').catch(()=>{});

    expect(mockedExpress.static).not.toHaveBeenCalled();
    const hasWildcardGet = fake.app.get.mock.calls.some(args => args[0] === "*");
    expect(hasWildcardGet).toBe(false);
  });
});