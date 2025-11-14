// import { NextResponse } from 'next/server';
// import fs from 'fs/promises';
// import path from 'path';

// /**
//  * DELETE handler for removing a stored link by id. This route is separate
//  * from the `/api/link/[id]` handler to avoid potential routing conflicts.
//  * It removes the entry from the JSON store and deletes the associated
//  * uploaded file from the `public/uploads` directory.
//  */
// export async function DELETE(
//   _req: Request,
//   { params }: { params: { id: string } }
// ) {
//   const { id } = params;
//   const dataFile = path.join(process.cwd(), 'data', 'links.json');
//   try {
//     const json = await fs.readFile(dataFile, 'utf8');
//     const links = JSON.parse(json);
//     const entry = links[id];
//     if (!entry) {
//       return NextResponse.json({ error: 'Not Found' }, { status: 404 });
//     }
//     // Remove associated uploaded image
//     if (entry.image) {
//       const cleaned = entry.image.startsWith('/') ? entry.image.slice(1) : entry.image;
//       const absolute = path.join(process.cwd(), 'public', cleaned);
//       try {
//         await fs.unlink(absolute);
//       } catch {
//         // ignore if file doesn't exist
//       }
//     }
//     delete links[id];
//     await fs.writeFile(dataFile, JSON.stringify(links, null, 2));
//     return NextResponse.json({ success: true });
//   } catch (err) {
//     console.error(err);
//     return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
//   }
// }
// app/api/delete/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// optional, but keeps this route always dynamic
export const dynamic = "force-dynamic";

// Helper: resolve the absolute image path for both old & new formats
async function deleteImageIfPresent(image: unknown) {
  if (!image || typeof image !== "string") return;

  let absolutePath: string | null = null;

  if (image.startsWith("/api/uploads/")) {
    // ✅ New format: served via /api/uploads → stored in /uploads
    const filename = image.slice("/api/uploads/".length); // remove prefix
    absolutePath = path.join(process.cwd(), "uploads", filename);
  } else if (image.startsWith("/uploads/")) {
    // Old format: directly under public/uploads
    const filename = image.slice("/".length); // remove leading '/'
    absolutePath = path.join(process.cwd(), "public", filename);
  } else {
    // Fallback: strip leading slash and assume under public/
    const rel = image.replace(/^\//, "");
    absolutePath = path.join(process.cwd(), "public", rel);
  }

  try {
    await fs.unlink(absolutePath);
  } catch {
    // ignore if file doesn't exist
  }
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const dataFile = path.join(process.cwd(), "data", "links.json");

  try {
    // read json db
    let linksData: Record<string, any> = {};
    try {
      linksData = JSON.parse(await fs.readFile(dataFile, "utf8"));
    } catch {
      linksData = {};
    }

    // Determine if file uses flat structure (id -> entry) or nested
    const hasFlatEntries = Object.values(linksData).some(
      (v: any) => v && typeof v === "object" && "id" in v
    );

    if (hasFlatEntries) {
      // In flat mode allow deletion without authentication for backward
      // compatibility. Only proceed if id exists.
      const entry = linksData[id];
      if (!entry) {
        return NextResponse.json({ error: "Not Found" }, { status: 404 });
      }

      // ✅ delete uploaded image (supports both /uploads and /api/uploads)
      await deleteImageIfPresent(entry.image);

      delete linksData[id];
      await fs.writeFile(dataFile, JSON.stringify(linksData, null, 2));
      return NextResponse.json({ success: true });
    }

    // In nested mode require authentication. Get username from cookie.
    const usernameCookie = req.cookies.get("username");
    const username = usernameCookie?.value;
    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Search for the entry within the user's own collection. If the
    // entry belongs to a different user, return a 403 error.
    let found = false;
    for (const user of Object.keys(linksData)) {
      const userEntries = linksData[user] ?? {};
      if (userEntries && typeof userEntries === "object" && id in userEntries) {
        if (user !== username) {
          // Prevent deleting someone else's link
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        const entry = userEntries[id];

        // ✅ remove uploaded image for nested mode as well
        await deleteImageIfPresent(entry.image);

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
    console.error("DELETE /api/delete/[id] error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
