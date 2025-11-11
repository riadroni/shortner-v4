import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

/**
 * POST handler for user login. Expects a JSON payload containing a
 * username and password. If the credentials are valid, a cookie
 * named `username` is set on the response which is used to
 * authenticate subsequent API requests. Passwords are stored as
 * SHA-256 hashes in the `data/users.json` file.
 */
export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    const dataDir = path.join(process.cwd(), 'data');
    await fs.mkdir(dataDir, { recursive: true });
    const usersFile = path.join(dataDir, 'users.json');
    let users: Record<string, string> = {};
    try {
      users = JSON.parse(await fs.readFile(usersFile, 'utf8'));
    } catch {
      users = {};
    }
    const storedHash = users[username];
    if (!storedHash) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }
    const providedHash = crypto.createHash('sha256').update(password).digest('hex');
    if (providedHash !== storedHash) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }
    // Set the username cookie. We deliberately do not mark it as
    // httpOnly so that client-side fetch requests can include it
    // automatically. Adjust maxAge as needed (e.g. session cookie).
    const res = NextResponse.json({ success: true });
    res.cookies.set('username', username, { path: '/' });
    return res;
  } catch (err) {
    console.error('POST /api/login error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}