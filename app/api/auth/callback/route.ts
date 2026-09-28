// app/api/auth/callback/route.ts
// Redirects to /auth/callback to support either callback URL path.
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = '/auth/callback';
  return NextResponse.redirect(url);
}
