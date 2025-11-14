import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

type RouteParams = Promise<{ id: string }>;

/**
 * GET handler to retrieve a stored link mapping by id.
 *
 * Responds with the associated image path and destination URLs
 * if the id exists, or a 404 Not Found otherwise.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: RouteParams }
) {
  const { id } = await params;

  try {
    const dataFile = path.join(process.cwd(), "data", "links.json");
    const json = await fs.readFile(dataFile, "utf8");
    const linksData: Record<string, any> = JSON.parse(json);

    // Determine if file is flat (id -> entry) or nested (user -> id -> entry)
    const hasFlatEntries = Object.values(linksData).some(
      (v: any) => v && typeof v === "object" && "id" in v
    );

    if (hasFlatEntries) {
      const entry = linksData[id];
      if (!entry) {
        return NextResponse.json({ error: "Not Found" }, { status: 404 });
      }
      return NextResponse.json(entry);
    }

    // nested: search all user namespaces
    for (const user of Object.keys(linksData)) {
      const userEntries = linksData[user] ?? {};
      if (
        userEntries &&
        typeof userEntries === "object" &&
        id in userEntries
      ) {
        return NextResponse.json(userEntries[id]);
      }
    }

    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }
}

/**
 * DELETE handler to remove a stored link mapping by id. It also removes
 * the associated uploaded file from the public/uploads directory if it exists.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: RouteParams }
) {
  const { id } = await params;

  const dataFile = path.join(process.cwd(), "data", "links.json");

  try {
    const json = await fs.readFile(dataFile, "utf8");
    let linksData: Record<string, any> = {};

    try {
      linksData = JSON.parse(json);
    } catch {
      linksData = {};
    }

    const hasFlatEntries = Object.values(linksData).some(
      (v: any) => v && typeof v === "object" && "id" in v
    );

    if (hasFlatEntries) {
      const entry = linksData[id];
      if (!entry) {
        return NextResponse.json({ error: "Not Found" }, { status: 404 });
      }

      // Remove uploaded image
      if (entry.image) {
        const cleaned = entry.image.startsWith("/")
          ? entry.image.slice(1)
          : entry.image;
        const absolute = path.join(process.cwd(), "public", cleaned);
        try {
          await fs.unlink(absolute);
        } catch {
          /* ignore */
        }
      }

      delete linksData[id];
      await fs.writeFile(dataFile, JSON.stringify(linksData, null, 2));
      return NextResponse.json({ success: true });
    }

    // nested: require authentication
    const usernameCookie = req.cookies.get("username");
    const username = usernameCookie?.value;

    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let found = false;

    for (const user of Object.keys(linksData)) {
      const userEntries = linksData[user] ?? {};

      if (
        userEntries &&
        typeof userEntries === "object" &&
        id in userEntries
      ) {
        if (user !== username) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const entry = userEntries[id];

        if (entry.image) {
          const cleaned = entry.image.startsWith("/")
            ? entry.image.slice(1)
            : entry.image;
          const absolute = path.join(process.cwd(), "public", cleaned);
          try {
            await fs.unlink(absolute);
          } catch {
            /* ignore */
          }
        }

        delete userEntries[id];
        linksData[user] = userEntries;
        found = true;
        break;
      }
    }

    if (!found) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    await fs.writeFile(dataFile, JSON.stringify(linksData, null, 2));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
