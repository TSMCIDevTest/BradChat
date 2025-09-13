/**
 * Test library/framework: Jest + Supertest
 * Rationale: Common Node/Express testing stack; aligns with repository conventions if Jest is present.
 * If this project uses Mocha/Chai instead, port `describe/it/expect` and `supertest` usage accordingly.
 */
import express from 'express';
import request from 'supertest';

// IMPORTANT: Adjust the import path below if the router lives somewhere else.
// Based on typical layout and the provided snippet, we assume backend/routes/auth.route.js
import authRouter from '../routes/auth.route.js';

// We will mock the controllers module that auth.route.js imports:
//   import { signup, login, logout } from '../controllers/auth.controller.js';
// Jest ESM mocking requires the same specifier string. Since the router resolves the controllers
// relatively, we intercept the module using jest.unstable_mockModule with the exact path
// relative to THIS test file. The router resolves '../controllers/auth.controller.js' from routes,
// which corresponds to './controllers/auth.controller.js' from backend/routes. From backend/tests,
// that path is '../controllers/auth.controller.js'.
const controllerModulePath = '../controllers/auth.controller.js';

// For ESM Jest, use unstable_mockModule when available (Jest 29+). Fallback to manual stubs if not.
let capturedHandlers = {};
try {
  // eslint-disable-next-line no-undef
  await jest.unstable_mockModule(controllerModulePath, () => {
    const makeHandler = (name) => (req, res, next) => {
      capturedHandlers[name]?.(req, res, next);
    };
    return {
      signup: makeHandler('signup'),
      login: makeHandler('login'),
      logout: makeHandler('logout'),
    };
  });
} catch (_) {
  // In case unstable_mockModule is not available, the tests will still import the router,
  // but direct controller behavior cannot be intercepted this way. We keep tests focused on routing.
}

// eslint-disable-next-line no-undef
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('auth routes', () => {
  // Helper to build an app with or without a mount path
  const buildApp = (mountPath = '/') => {
    const app = express();
    app.use(express.json());
    app.use(mountPath, authRouter);
    // Basic error handler to surface thrown errors as 500 JSON for assertions
    // eslint-disable-next-line no-unused-vars
    app.use((err, req, res, next) => {
      res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
    });
    return app;
  };

  beforeEach(() => {
    capturedHandlers = {
      signup: undefined,
      login: undefined,
      logout: undefined,
    };
  });

  describe('POST /signup', () => {
    test('calls signup controller and returns its JSON result (happy path)', async () => {
      const app = buildApp('/');
      capturedHandlers.signup = (req, res) => {
        expect(req.method).toBe('POST');
        expect(req.body).toEqual({ email: 'a@b.com', password: 'secret' });
        return res.status(201).json({ ok: true, id: 'user-1' });
      };
      const res = await request(app)
        .post('/signup')
        .send({ email: 'a@b.com', password: 'secret' })
        .expect(201);
      expect(res.body).toEqual({ ok: true, id: 'user-1' });
    });

    test('propagates controller error thrown to error handler (500)', async () => {
      const app = buildApp('/');
      capturedHandlers.signup = () => {
        throw new Error('boom');
      };
      const res = await request(app).post('/signup').send({}).expect(500);
      expect(res.body).toHaveProperty('message');
    });

    test('propagates next(err) from controller', async () => {
      const app = buildApp('/');
      capturedHandlers.signup = (_, __, next) => next(new Error('bad'));
      const res = await request(app).post('/signup').send({}).expect(500);
      expect(res.body.message).toMatch(/bad/i);
    });

    test('returns 404 on GET (method not allowed by router)', async () => {
      const app = buildApp('/');
      await request(app).get('/signup').expect(404);
    });
  });

  describe('POST /login', () => {
    test('calls login controller and returns token', async () => {
      const app = buildApp('/');
      capturedHandlers.login = (req, res) => {
        expect(req.body).toEqual({ email: 'a@b.com', password: 'secret' });
        return res.status(200).json({ token: 'jwt.token.here' });
      };
      const res = await request(app).post('/login').send({ email: 'a@b.com', password: 'secret' }).expect(200);
      expect(res.body).toEqual({ token: 'jwt.token.here' });
    });

    test('handles missing body gracefully (still reaches controller)', async () => {
      const app = buildApp('/');
      capturedHandlers.login = (req, res) => {
        // body-parser yields {} when no JSON provided with content-type; supertest send() covers that already.
        return res.status(400).json({ error: 'invalid' });
      };
      const res = await request(app).post('/login').send({}).expect(400);
      expect(res.body).toEqual({ error: 'invalid' });
    });

    test('returns 404 on non-POST', async () => {
      const app = buildApp('/');
      await request(app).get('/login').expect(404);
    });
  });

  describe('POST /logout', () => {
    test('calls logout controller and returns 204 No Content', async () => {
      const app = buildApp('/');
      capturedHandlers.logout = (_req, res) => res.status(204).send();
      await request(app).post('/logout').send({}).expect(204);
    });

    test('returns 404 on non-POST', async () => {
      const app = buildApp('/');
      await request(app).get('/logout').expect(404);
    });
  });

  describe('mount path behavior', () => {
    test('router works when mounted at /api/auth', async () => {
      const app = buildApp('/api/auth');
      capturedHandlers.login = (_req, res) => res.status(200).json({ ok: true });
      const res = await request(app).post('/api/auth/login').send({}).expect(200);
      expect(res.body).toEqual({ ok: true });
    });
  });
});