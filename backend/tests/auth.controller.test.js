

import { jest } from "@jest/globals";

/**
 * We import the module under test after setting up jest.mocks so that ESM hoisting honors mocks.
 * If your project uses CommonJS, convert imports to require() accordingly.
 */
jest.unstable_mockModule("../models/User.js", () => ({
  default: {
    findOne: jest.fn(),
    prototype: {},
  },
}));

jest.unstable_mockModule("bcryptjs", () => ({
  default: {
    genSalt: jest.fn(),
    hash: jest.fn(),
  },
}));

// Mock generateToken to verify it is invoked correctly without setting cookies
const generateTokenSpy = jest.fn();
jest.unstable_mockModule("../lib/utils.js", () => ({
  generateToken: (...args) => generateTokenSpy(...args),
}));

// Dynamically import after mocks
const { signup, login, logout } = await import("../controllers/auth.controller.js");
const User = (await import("../models/User.js")).default;
const bcrypt = (await import("bcryptjs")).default;

// Minimal mock for Express.js res object
const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  return res;
};

describe("Auth Controller - signup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when required fields are missing", async () => {
    const cases = [
      { body: { fullName: "", email: "a@b.com", password: "123456" }, msg: "All fields are required." },
      { body: { fullName: "A", email: "", password: "123456" }, msg: "All fields are required." },
      { body: { fullName: "A", email: "a@b.com", password: "" }, msg: "All fields are required." },
    ];
    for (const c of cases) {
      const req = { body: c.body };
      const res = createRes();

      await signup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "All fields are required." });
      expect(generateTokenSpy).not.toHaveBeenCalled();
    }
  });

  it("returns 400 when password length < 6", async () => {
    const req = { body: { fullName: "Alice", email: "alice@example.com", password: "12345" } };
    const res = createRes();

    await signup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Password must be at least 6 characters long." });
    expect(generateTokenSpy).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid email format", async () => {
    const req = { body: { fullName: "Bob", email: "not-an-email", password: "abcdef" } };
    const res = createRes();

    await signup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid email format" });
    expect(generateTokenSpy).not.toHaveBeenCalled();
  });

  it("returns 400 if email already exists", async () => {
    User.findOne.mockResolvedValueOnce({ _id: "u1" });

    const req = { body: { fullName: "Carol", email: "carol@example.com", password: "abcdef" } };
    const res = createRes();

    await signup(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: "carol@example.com" });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Email already exists" });
    expect(generateTokenSpy).not.toHaveBeenCalled();
  });

  it("creates user, saves, generates token, and returns 201 with payload on happy path", async () => {
    User.findOne.mockResolvedValueOnce(null);
    bcrypt.genSalt.mockResolvedValueOnce("salt");
    bcrypt.hash.mockResolvedValueOnce("hashed");

    // Spy on User constructor to intercept instance methods save and fields
    const savedDoc = {
      _id: "new-id-123",
      fullName: "Dave",
      email: "dave@example.com",
      profilePic: "default.png",
      save: jest.fn().mockResolvedValue(true),
    };

    // Since the controller does `new User({...})`, we need to make default export callable as constructor.
    // We simulate this by replacing default export with a function that returns savedDoc.
    // Note: For ESM mock above we exposed an object; here we override to a constructor-like mock.
    const ctorMock = jest.fn().mockReturnValue(savedDoc);
    // Replace module default with a callable
    Object.assign(User, ctorMock);

    const req = { body: { fullName: "Dave", email: "dave@example.com", password: "abcdef" } };
    const res = createRes();

    await signup(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: "dave@example.com" });
    expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
    expect(bcrypt.hash).toHaveBeenCalledWith("abcdef", "salt");
    expect(ctorMock).toHaveBeenCalledWith({
      fullName: "Dave",
      email: "dave@example.com",
      password: "hashed",
    });
    expect(generateTokenSpy).toHaveBeenCalledWith("new-id-123", res);
    expect(savedDoc.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      _id: "new-id-123",
      fullName: "Dave",
      email: "dave@example.com",
      profilePic: "default.png",
    });
  });

  it("returns 400 when new User construction fails (falsy) and does not call save", async () => {
    User.findOne.mockResolvedValueOnce(null);
    bcrypt.genSalt.mockResolvedValueOnce("salt");
    bcrypt.hash.mockResolvedValueOnce("hashed");

    // Force constructor to return falsy
    const ctorMock = jest.fn().mockReturnValue(null);
    Object.assign(User, ctorMock);

    const req = { body: { fullName: "Eve", email: "eve@example.com", password: "abcdef" } };
    const res = createRes();

    await signup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid user data" });
    expect(generateTokenSpy).not.toHaveBeenCalled();
  });

  it("handles unexpected errors with 500 and logs", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    User.findOne.mockRejectedValueOnce(new Error("DB down"));

    const req = { body: { fullName: "Frank", email: "frank@example.com", password: "abcdef" } };
    const res = createRes();

    await signup(req, res);

    expect(consoleSpy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });

    consoleSpy.mockRestore();
  });
});

describe("Auth Controller - login", () => {
  it("responds with Login endpoint", async () => {
    const req = { body: {} };
    const res = createRes();

    await login(req, res);

    expect(res.send).toHaveBeenCalledWith("Login endpoint");
  });
});

describe("Auth Controller - logout", () => {
  it("responds with Logout endpoint", async () => {
    const req = { body: {} };
    const res = createRes();

    await logout(req, res);

    expect(res.send).toHaveBeenCalledWith("Logout endpoint");
  });
});