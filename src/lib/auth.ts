import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { AppConfig } from './config';
import { SessionUser } from '@/types';

const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'espb_ppdb_super_secure_jwt_session_secret_key_beluran_2026_sabah'
);

const COOKIE_NAME = 'espb_admin_token';

export async function createSessionToken(user: { role: 'admin' | 'staff'; email?: string }): Promise<string> {
  const durationHours = AppConfig.SESSION_DURATION_HOURS || 4;
  const exp = Math.floor(Date.now() / 1000) + durationHours * 3600;

  return new SignJWT({
    role: user.role,
    email: user.email || 'admin@moe.gov.my',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      algorithms: ['HS256'],
    });

    return {
      role: (payload.role as 'admin' | 'staff') || 'admin',
      email: payload.email as string | undefined,
      exp: payload.exp as number,
      iat: payload.iat as number,
    };
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export function setSessionCookie(token: string) {
  const cookieStore = cookies();
  const maxAge = (AppConfig.SESSION_DURATION_HOURS || 4) * 3600;
  
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: maxAge,
    path: '/',
  });
}

export function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME);
}

// In-memory rate limiting map for login attempts
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

export function checkRateLimit(ipOrIdentifier: string): { allowed: boolean; remaining: number; lockedUntil?: number } {
  const now = Date.now();
  const record = loginAttempts.get(ipOrIdentifier);

  if (record) {
    if (record.lockedUntil > now) {
      return { allowed: false, remaining: 0, lockedUntil: record.lockedUntil };
    }
    if (record.lockedUntil <= now && record.count >= AppConfig.MAX_LOGIN_ATTEMPTS) {
      loginAttempts.delete(ipOrIdentifier);
    }
  }

  const currentCount = loginAttempts.get(ipOrIdentifier)?.count || 0;
  const remaining = Math.max(0, AppConfig.MAX_LOGIN_ATTEMPTS - currentCount);

  return { allowed: remaining > 0, remaining };
}

export function recordFailedAttempt(ipOrIdentifier: string) {
  const now = Date.now();
  const record = loginAttempts.get(ipOrIdentifier) || { count: 0, lockedUntil: 0 };
  record.count += 1;

  if (record.count >= AppConfig.MAX_LOGIN_ATTEMPTS) {
    record.lockedUntil = now + AppConfig.LOCKOUT_MINUTES * 60 * 1000;
  }

  loginAttempts.set(ipOrIdentifier, record);
}

export function clearRateLimit(ipOrIdentifier: string) {
  loginAttempts.delete(ipOrIdentifier);
}
