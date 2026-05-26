import { createClient } from '@supabase/supabase-js';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

if (!SUPABASE_URL || !SERVICE_ROLE || !JWT_SECRET) {
  throw new Error(
    'SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_JWT_SECRET env vars required',
  );
}

// Service-role client: bypasses RLS. Used by middleware-less server code
// (seed scripts, bot, admin endpoints) — never expose to browser.
export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// New Supabase projects sign access tokens with asymmetric ES256 keys.
// JWT_SECRET is kept only for legacy HS256 tokens (older sessions).
const JWKS = createRemoteJWKSet(new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`));
const SECRET_BYTES = new TextEncoder().encode(JWT_SECRET);

export async function verifySupabaseJWT(
  token: string,
): Promise<{ sub: string; email?: string }> {
  let payload: JWTPayload;
  try {
    ({ payload } = await jwtVerify(token, JWKS, { audience: 'authenticated' }));
  } catch {
    ({ payload } = await jwtVerify(token, SECRET_BYTES, { audience: 'authenticated' }));
  }
  if (typeof payload.sub !== 'string') {
    throw new Error('JWT missing sub claim');
  }
  return {
    sub: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : undefined,
  };
}
