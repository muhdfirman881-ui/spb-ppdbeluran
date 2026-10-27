import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, verifySessionToken } from './auth';
import { SessionUser } from '@/types';

export type GuardResult =
  | { authorized: true; user: SessionUser; response?: never }
  | { authorized: false; response: NextResponse; user?: never };

export async function requireAdmin(request?: NextRequest): Promise<GuardResult> {
  // Check cookie session first
  const cookieUser = await getSessionUser();
  if (cookieUser && cookieUser.role === 'admin') {
    return { authorized: true, user: cookieUser };
  }

  // Check Bearer token header if present
  if (request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const tokenUser = await verifySessionToken(token);
      if (tokenUser && tokenUser.role === 'admin') {
        return { authorized: true, user: tokenUser };
      }
    }
  }

  return {
    authorized: false,
    response: NextResponse.json(
      { success: false, error: 'Akses tanpa kebenaran. Sila log masuk sebagai pentadbir.', code: 'UNAUTHORIZED' },
      { status: 401 }
    ),
  };
}
