import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

/**
 * GET handler to retrieve all stored link mappings. The data is stored
 * as an object keyed by id in the JSON file. This endpoint returns
 * that object directly. If the file is missing or invalid, it
 * returns an empty object.
 */
// The GET handler now accepts a NextRequest so that we can read
// cookies sent by the client. We return only the entries for the
// authenticated user. If no authentication cookie is present we
// respond with a 401 status to indicate that login is required.
export async function GET(req: NextRequest) {
  // Determine which user is making the request. We expect the
  // frontend to set a cookie named `username` after a successful
  // login. Without this cookie we cannot scope the returned data
  // and therefore reject the request.
  const usernameCookie = req.cookies.get('username');
  const username = usernameCookie?.value;
  if (!username) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const dataFile = path.join(process.cwd(), 'data', 'links.json');
  try {
    const json = await fs.readFile(dataFile, 'utf8');
    const linksData = JSON.parse(json) as Record<string, any>;
    // If the file is organised by id at the root (flat structure),
    // return all entries so that legacy data remains visible. A
    // flat structure is detected by checking if any value has an id
    // property. Otherwise we assume the top-level keys are user
    // names.
    const hasFlatEntries = Object.values(linksData).some((v: any) =>
      v && typeof v === 'object' && 'id' in v
    );
    if (hasFlatEntries) {
      return NextResponse.json(linksData);
    }
    const userLinks = linksData[username] ?? {};
    return NextResponse.json(userLinks);
  } catch {
    return NextResponse.json({});
  }
}