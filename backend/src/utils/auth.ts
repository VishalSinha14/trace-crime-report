import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthTokenPayload } from '../models/types';

// ─── Fail fast if JWT secret is not configured ────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  // In test/CI environments a stub is acceptable; in runtime it must be set.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_SECRET environment variable is not set. Server cannot start.');
  }
  console.warn('⚠️  WARNING: JWT_SECRET not set. Using ephemeral dev secret — set JWT_SECRET in .env for production.');
}
const _JWT_SECRET = JWT_SECRET || `trace_ephemeral_${Date.now()}_${Math.random()}`;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12); // cost factor 12 — stronger than 10
  return bcrypt.hash(password, salt);
}

/**
 * Compare plain-text password against a bcrypt hash only.
 * SHA-256 fallback has been intentionally removed for security.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  if (hash.startsWith('$2a$') || hash.startsWith('$2b$')) {
    return bcrypt.compare(password, hash);
  }
  // Reject any non-bcrypt hash (old SHA-256 seeded passwords, etc.)
  console.warn('comparePassword: rejecting non-bcrypt hash — user must be re-seeded.');
  return false;
}

export function generateToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, _JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as any,
  });
}

export function verifyToken(token: string): AuthTokenPayload {
  return jwt.verify(token, _JWT_SECRET) as AuthTokenPayload;
}

