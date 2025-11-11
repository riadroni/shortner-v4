import { NextResponse } from 'next/server';

/**
 * POST handler for logging out a user. It simply clears the
 * `username` cookie by setting an empty value with an expired
 * maxAge. Clients should call this endpoint to sign out.
 */
export async function POST() {
  const res = NextResponse.json({ success: true });
  // Clear the cookie by setting maxAge to 0
  res.cookies.set('username', '', { path: '/', maxAge: 0 });
  return res;
}