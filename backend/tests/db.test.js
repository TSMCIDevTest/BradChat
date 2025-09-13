/**
 * NOTE ON TESTING LIBRARY:
 * These tests are written using Jest syntax (describe/it/expect, jest.spyOn, jest.mock).
 * If the project uses Mocha/Chai/Sinon, translate jest mocks/spies accordingly to match the existing setup.
 */

const ORIGINAL_ENV = process.env;

// We will dynamically import the module under test after setting up mocks
// to ensure the module picks up our mocked dependencies.
describe('connectDB', () => {
  let mockConnect;
  let connectDB;
  let originalExit;

  beforeEach(async () => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV }; // isolate env per test

    // Mock console
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock process.exit to avoid terminating the test runner
    originalExit = process.exit;
    process.exit = jest.fn();

    // Mock mongoose
    mockConnect = jest.fn();
    jest.doMock('mongoose', () => {
      return {
        __esModule: true,
        default: {
          connect: mockConnect
        }
      };
    });

    // Attempt to resolve the module under test from common locations.
    // Adjust the import path below to match the actual file exporting `connectDB`.
    // The PR diff snippet shows:
    //   export const connectDB = async (mongoURI) => { ... }
    // and it imports `mongoose` from 'mongoose'.
    //
    // Try typical paths first; if none match, update to the correct module path.
    let mod;
    const candidates = [
      'backend/config/db.js',
      'backend/db.js',
      'backend/db/index.js',
      'backend/src/config/db.js',
      'backend/src/db.js',
      'backend/src/db/index.js',
      './db.js',
    ];
    let lastErr;
    for (const p of candidates) {
      // eslint-disable-next-line no-await-in-loop
      try {
        // Try importing; if it fails, swallow and continue to next candidate
        try {
          mod = await import(p.startsWith('.') ? p : `../../${p}`);
        } catch (e) {
          lastErr = e;
          mod = null;
        }
        if (mod && (mod.connectDB || (mod.default && mod.default.connectDB))) {
          break;
        }
      } catch (e) {
        lastErr = e;
      }
    }
    if (!mod) {
      // Fallback to relative path from test file if the source file was placed alongside tests for this exercise
      try {
        mod = await import('../db.js');
      } catch (e) {
        // If still failing, throw a clear error instructing to fix import path.
        // This keeps the tests self-documenting and actionable.
        throw new Error(
          "Unable to locate the module that exports `connectDB`. " +
          "Update the import path in backend/tests/db.test.js to the correct file path."
        );
      }
    }
    connectDB = mod.connectDB || (mod.default && mod.default.connectDB);
    if (typeof connectDB !== 'function') {
      throw new Error("The imported `connectDB` is not a function. Ensure it's exported as a named export.");
    }
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = ORIGINAL_ENV;
    process.exit = originalExit;
  });

  test('success: calls mongoose.connect with process.env.MONGO_URI and logs connected host', async () => {
    process.env.MONGO_URI = 'mongodb://correct-uri:27017/db';
    const fakeConn = { connection: { host: 'mock-host.local' } };
    mockConnect.mockResolvedValueOnce(fakeConn);

    await connectDB('mongodb://ignored-uri:27017/should-not-be-used');

    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(mockConnect).toHaveBeenCalledWith(process.env.MONGO_URI);
    expect(console.log).toHaveBeenCalledWith('MongoDB connected:', 'mock-host.local');
    expect(process.exit).not.toHaveBeenCalled();
  });

  test('failure: logs error and exits process with code 1 when mongoose.connect rejects', async () => {
    process.env.MONGO_URI = 'mongodb://bad-uri:27017/db';
    const err = new Error('connection failed');
    mockConnect.mockRejectedValueOnce(err);

    await connectDB(process.env.MONGO_URI);

    expect(console.error).toHaveBeenCalledTimes(1);
    const [msg, payload] = console.error.mock.calls[0];
    expect(msg).toBe('Error connecting to MongoDB:');
    expect(payload).toBe(err);
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  test('edge: when MONGO_URI is undefined, still attempts to connect with undefined and handles success log', async () => {
    delete process.env.MONGO_URI;
    const fakeConn = { connection: { host: 'no-env-host' } };
    mockConnect.mockResolvedValueOnce(fakeConn);

    await connectDB(); // no argument; function uses process.env.MONGO_URI internally

    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(mockConnect).toHaveBeenCalledWith(undefined);
    expect(console.log).toHaveBeenCalledWith('MongoDB connected:', 'no-env-host');
    expect(process.exit).not.toHaveBeenCalled();
  });

  test('verifies the function ignores the passed mongoURI argument in favor of process.env.MONGO_URI', async () => {
    process.env.MONGO_URI = 'mongodb://env-uri:27017/db';
    const fakeConn = { connection: { host: 'env-host' } };
    mockConnect.mockResolvedValueOnce(fakeConn);

    await connectDB('mongodb://passed-in-uri:27017/db');

    expect(mockConnect).toHaveBeenCalledWith('mongodb://env-uri:27017/db');
    expect(mockConnect).not.toHaveBeenCalledWith('mongodb://passed-in-uri:27017/db');
  });
});