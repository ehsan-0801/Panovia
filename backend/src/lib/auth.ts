import { randomBytes, randomUUID, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { SignJWT, jwtVerify } from 'jose';
import { env } from '../config/env.js';

const scrypt = promisify(scryptCb) as (
  password: string | Buffer, salt: string | Buffer, keylen: number,
) => Promise<Buffer>;

const KEYLEN = 64;
const secret = new TextEncoder().encode(env.auth.jwtSecret);

/**
 * Password hashing uses scrypt from node's crypto module — memory-hard, in the
 * standard library, and therefore one less native dependency to build on Render.
 * Stored as `scrypt$<salt-hex>$<hash-hex>`.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, KEYLEN);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  const [scheme, saltHex, hashHex] = stored.split('$');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export interface TokenPayload {
  sub: string;
  email: string;
}

/** Issues the API's own access token (HS256), shaped like the session the SPA expects. */
export async function issueSession(user: { id: string; email: string }) {
  const expiresIn = env.auth.tokenTtlSeconds;
  const access_token = await new SignJWT({ email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setIssuer('panovia-api')
    .setExpirationTime(`${expiresIn}s`)
    .sign(secret);
  return {
    access_token,
    token_type: 'bearer' as const,
    expires_in: expiresIn,
    expires_at: Math.floor(Date.now() / 1000) + expiresIn,
  };
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, secret, { issuer: 'panovia-api' });
  if (!payload.sub) throw new Error('Token has no subject');
  return { sub: payload.sub, email: (payload.email as string) ?? '' };
}

/** Opaque, single-use password-reset token (the raw value is emailed, never stored). */
export function newResetToken() {
  return { raw: randomBytes(32).toString('hex'), id: randomUUID() };
}
