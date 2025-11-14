import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

/**
 * Handles POST requests for creating a new shortened URL.
 */
export async function POST(req: NextRequest) {
  try {
    const usernameCookie = req.cookies.get("username");
    const username = usernameCookie?.value;
    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const id = formData.get("id");
    const urlMobile = formData.get("urlMobile");
    const urlDesktop = formData.get("urlDesktop");
    const file = formData.get("image");

    if (
      typeof id !== "string" ||
      typeof urlMobile !== "string" ||
      !(file instanceof File)
    ) {
      return NextResponse.json(
        { error: "Invalid form submission" },
        { status: 400 }
      );
    }

    // ✅ 1) Save uploads OUTSIDE public/
    const uploadsDir = path.join(process.cwd(), "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const originalName = file.name.replace(/\s+/g, "_");
    const timestamp = Date.now();
    const sanitizedFileName = `${id}-${timestamp}-${originalName}`;
    const filePath = path.join(uploadsDir, sanitizedFileName);
    await fs.writeFile(filePath, buffer);

    // ✅ 2) Store API path instead of /uploads/…
    const imagePath = `/api/uploads/${sanitizedFileName}`;

    // ---- links.json handling (unchanged) ----
    const dataDir = path.join(process.cwd(), "data");
    await fs.mkdir(dataDir, { recursive: true });
    const dataFile = path.join(dataDir, "links.json");
    let linksData: Record<string, any> = {};
    try {
      const json = await fs.readFile(dataFile, "utf8");
      linksData = JSON.parse(json);
    } catch {
      linksData = {};
    }

    const hasFlatEntries = Object.values(linksData).some(
      (v: any) => v && typeof v === "object" && "id" in v
    );

    if (hasFlatEntries) {
      if (linksData[id]) {
        return NextResponse.json(
          { error: "ID already exists" },
          { status: 400 }
        );
      }
    } else {
      for (const userKey of Object.keys(linksData)) {
        const userEntries = linksData[userKey] ?? {};
        if (userEntries && typeof userEntries === "object" && id in userEntries) {
          return NextResponse.json(
            { error: "ID already exists" },
            { status: 400 }
          );
        }
      }
    }

    const newEntry = {
      id,
      image: imagePath, // ✅ using the API URL
      urlMobile,
      urlDesktop: typeof urlDesktop === "string" ? urlDesktop : "",
    };

    if (hasFlatEntries) {
      const migrated: Record<string, any> = {};
      migrated["global"] = linksData;
      migrated[username] = { [id]: newEntry };
      linksData = migrated;
    } else {
      const userMap: Record<string, any> = linksData[username] ?? {};
      userMap[id] = newEntry;
      linksData[username] = userMap;
    }

    await fs.writeFile(dataFile, JSON.stringify(linksData, null, 2));

    const origin = req.headers.get("origin") ?? "";
    const shortUrl = `${origin}/${id}`;

    return NextResponse.json({ link: shortUrl }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
