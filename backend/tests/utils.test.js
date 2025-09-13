

/**
 * Tests for generateToken
 * Testing library/framework: Jest
 * Focus areas:
 *  - Signs JWT with correct payload, secret, and options
 *  - Sets cookie with expected attributes (httpOnly, sameSite, maxAge, secure)
 *  - Environment-driven 'secure' behavior including the current "devlopment" typo path
 *  - Error propagation when jwt.sign or res.cookie fails
 *  - Edge cases such as missing user._id
 *
 * These tests are appended to this file to conform to the repo's testing layout.
 */

describe("generateToken", () => {
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const ORIGINAL_ENV = process.env;

  // Helper to create a minimal response mock with cookie spy
  const createRes = () => ({ cookie: jest.fn() });

  beforeEach(() => {
    jest.restoreAllMocks();
    // Reset env for test determinism while preserving unrelated vars
    process.env = { ...ORIGINAL_ENV };
    // Ensure a default secret exists unless overridden in a test
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  test("signs JWT with user id and sets a secure, httpOnly cookie in production", () => {
    process.env.NODE_ENV = "production";
    const res = createRes();
    const user = { _id: "user-1" };

    const signSpy = jest.spyOn(jwt, "sign").mockReturnValue("tok-123");

    const token = generateToken(user, res);

    // Return value
    expect(token).toBe("tok-123");

    // jwt.sign invocation
    expect(signSpy).toHaveBeenCalledTimes(1);
    expect(signSpy).toHaveBeenCalledWith(
      { UserId: "user-1" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Cookie set with expected options
    expect(res.cookie).toHaveBeenCalledTimes(1);
    const [name, value, options] = res.cookie.mock.calls[0];
    expect(name).toBe("token");
    expect(value).toBe("tok-123");
    expect(options).toEqual({
      maxAge: WEEK_MS,
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
  });

  test('sets secure=false when NODE_ENV is exactly "devlopment" (current implementation path due to typo)', () => {
    // Intentionally exercising the "devlopment" branch in the implementation
    process.env.NODE_ENV = "devlopment";
    const res = createRes();

    jest.spyOn(jwt, "sign").mockReturnValue("tok-456");
    generateToken({ _id: "user-2" }, res);

    const options = res.cookie.mock.calls[0][2];
    expect(options.secure).toBe(false);
  });

  test('sets secure=true when NODE_ENV is "development" (demonstrates current typo-driven behavior)', () => {
    // With correct spelling "development", code currently treats it as production (secure: true)
    process.env.NODE_ENV = "development";
    const res = createRes();

    jest.spyOn(jwt, "sign").mockReturnValue("tok-789");
    generateToken({ _id: "user-3" }, res);

    const options = res.cookie.mock.calls[0][2];
    expect(options.secure).toBe(true);
  });

  test("defaults to secure=true when NODE_ENV is unset", () => {
    delete process.env.NODE_ENV;
    const res = createRes();

    jest.spyOn(jwt, "sign").mockReturnValue("tok-000");
    generateToken({ _id: "user-0" }, res);

    const options = res.cookie.mock.calls[0][2];
    expect(options.secure).toBe(true);
  });

  test("propagates error if jwt.sign throws and does not set cookie", () => {
    const res = createRes();
    const err = new Error("sign failed");

    jest.spyOn(jwt, "sign").mockImplementation(() => {
      throw err;
    });

    expect(() => generateToken({ _id: "user-4" }, res)).toThrow(err);
    expect(res.cookie).not.toHaveBeenCalled();
  });

  test("throws if res.cookie is missing (invalid response object)", () => {
    const badRes = {}; // no cookie method
    jest.spyOn(jwt, "sign").mockReturnValue("tok-x");

    expect(() => generateToken({ _id: "user-5" }, badRes)).toThrow();
  });

  test("calls jwt.sign even if user._id is undefined", () => {
    process.env.NODE_ENV = "production";
    const res = createRes();

    const signSpy = jest.spyOn(jwt, "sign").mockReturnValue("tok-y");
    generateToken({}, res);

    expect(signSpy).toHaveBeenCalledWith(
      { UserId: undefined },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
  });
});