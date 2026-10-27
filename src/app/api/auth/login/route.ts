import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'Log masuk menggunakan kata laluan telah dinyahaktifkan sepenuhnya. Sila gunakan log masuk rasmi Google Workspace (@moe.gov.my).',
      code: 'PASSWORD_LOGIN_DISABLED',
    },
    { status: 403 }
  );
}
