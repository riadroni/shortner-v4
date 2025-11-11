import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

/**
 * Handles POST requests for creating a new shortened URL.
 *
 * The request is expected to include a `FormData` body with the following
 * fields:
 *   - id: a string specifying the custom identifier for the short link
 *   - image: an uploaded image file (e.g. GIF) shown during redirect
 *   - mobile: the destination URL for mobile visitors
 *   - desktop: the destination URL for desktop visitors
 *
 * On success the handler persists the file to the `public/uploads` folder,
 * saves the mapping in `data/links.json` and returns the short URL derived
 * from the request's origin and the custom id.
 */
export async function POST(req: NextRequest) {
  try {
    // Determine the logged in user from the cookie. Without a
    // username cookie we cannot associate the new entry with a user.
    const usernameCookie = req.cookies.get('username');
    const username = usernameCookie?.value;
    if (!username) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const id = formData.get('id');
    // Note: The field names differ from the original implementation.
    // We expect "urlMobile" and "urlDesktop" for the two destination URLs.
    const urlMobile = formData.get('urlMobile');
    const urlDesktop = formData.get('urlDesktop');
    const file = formData.get('image');

    // Validate types. The desktop URL may be omitted (empty string), but
    // id must be a string and file must be a File.
    if (
      typeof id !== 'string' ||
      typeof urlMobile !== 'string' ||
      !(file instanceof File)
    ) {
      return NextResponse.json({ error: 'Invalid form submission' }, { status: 400 });
    }

    // Ensure required directories exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    // Persist the uploaded file to disk. Use a timestamp to avoid collisions.
    const buffer = Buffer.from(await file.arrayBuffer());
    const originalName = file.name.replace(/\s+/g, '_');
    const timestamp = Date.now();
    const sanitizedFileName = `${id}-${timestamp}-${originalName}`;
    const filePath = path.join(uploadsDir, sanitizedFileName);
    await fs.writeFile(filePath, buffer);

    // Image path to serve via Next.js static file serving
    const imagePath = `/uploads/${sanitizedFileName}`;

    // Read existing links data (or initialize empty object)
    const dataDir = path.join(process.cwd(), 'data');
    await fs.mkdir(dataDir, { recursive: true });
    const dataFile = path.join(dataDir, 'links.json');
    let linksData: Record<string, any> = {};
    try {
      const json = await fs.readFile(dataFile, 'utf8');
      linksData = JSON.parse(json);
    } catch {
      // file may not exist yet
      linksData = {};
    }

    // Determine if the file is using the old flat format (id -> entry) or
    // the new nested format (username -> { id -> entry }). If any value
    // has an `id` property, we assume the old format.
    const hasFlatEntries = Object.values(linksData).some(
      (v: any) => v && typeof v === 'object' && 'id' in v
    );

    // Check for duplicate ID across all users. If the structure is
    // flat then we can simply check the root object. If nested we
    // must check each user's collection.
    if (hasFlatEntries) {
      // In flat mode, a duplicate id simply means the key exists on the root object
      if (linksData[id]) {
        return NextResponse.json({ error: 'ID already exists' }, { status: 400 });
      }
    } else {
      for (const userKey of Object.keys(linksData)) {
        const userEntries = linksData[userKey] ?? {};
        if (userEntries && typeof userEntries === 'object' && id in userEntries) {
          return NextResponse.json({ error: 'ID already exists' }, { status: 400 });
        }
      }
    }

    // Prepare new entry. Always include the urlDesktop key, even if empty.
    const newEntry = {
      id,
      image: imagePath,
      urlMobile: urlMobile,
      urlDesktop: typeof urlDesktop === 'string' ? urlDesktop : ''
    };

    if (hasFlatEntries) {
      // Migrate existing flat entries into a nested structure under a
      // special "global" key on first write. This preserves all
      // previously-created links while introducing user namespacing.
      const migrated: Record<string, any> = {};
      migrated['global'] = linksData;
      migrated[username] = { [id]: newEntry };
      linksData = migrated;
    } else {
      // Ensure the current user has an object to hold their entries
      const userMap: Record<string, any> = linksData[username] ?? {};
      userMap[id] = newEntry;
      linksData[username] = userMap;
    }

    await fs.writeFile(dataFile, JSON.stringify(linksData, null, 2));

    // Build the short URL using the request origin
    const origin = req.headers.get('origin') ?? '';
    const shortUrl = `${origin}/${id}`;

    return NextResponse.json({ link: shortUrl }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}