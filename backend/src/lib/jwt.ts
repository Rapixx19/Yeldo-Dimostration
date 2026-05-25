import jwt, { type SignOptions } from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  throw new Error('JWT_SECRET env var required');
}

const EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'];

export function signToken(userId: string): string {
  return jwt.sign({ userId }, SECRET as string, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): { userId: string } {
  return jwt.verify(token, SECRET as string) as { userId: string };
}
