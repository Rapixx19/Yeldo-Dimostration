import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';
import { signToken } from '../lib/jwt.js';

const ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 10);
const DEMO_EMAIL = 'recruiter@yeldo-demo.app';

export async function signup(email: string, password: string, name: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error('EMAIL_TAKEN');

  const passwordHash = await bcrypt.hash(password, ROUNDS);
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
  });
  return { user, token: signToken(user.id) };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('INVALID_CREDENTIALS');
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error('INVALID_CREDENTIALS');
  return { user, token: signToken(user.id) };
}

export async function demoLogin() {
  const user = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (!user) throw new Error('DEMO_USER_NOT_SEEDED');
  return { user, token: signToken(user.id) };
}
