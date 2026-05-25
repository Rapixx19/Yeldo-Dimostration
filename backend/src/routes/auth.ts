import { Router } from 'express';
import { signupSchema, loginSchema } from '../schemas/auth.js';
import { signup, login, demoLogin } from '../services/auth.js';

const router = Router();

function publicUser(user: { id: string; email: string; name: string }) {
  return { id: user.id, email: user.email, name: user.name };
}

router.post('/signup', async (req, res, next) => {
  try {
    const data = signupSchema.parse(req.body);
    const result = await signup(data.email, data.password, data.name);
    res.status(201).json({ user: publicUser(result.user), token: result.token });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await login(data.email, data.password);
    res.json({ user: publicUser(result.user), token: result.token });
  } catch (err) {
    next(err);
  }
});

router.post('/demo-login', async (_req, res, next) => {
  try {
    const result = await demoLogin();
    res.json({ user: publicUser(result.user), token: result.token });
  } catch (err) {
    next(err);
  }
});

export default router;
