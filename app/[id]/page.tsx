import fs from "fs/promises";
import path from "path";
import { notFound } from "next/navigation";
import RedirectComponent from "./RedirectComponent";

// Force runtime rendering and disable static regeneration. Without this,
// Next.js may try to pre-render pages and not pick up new entries in
// the JSON file, which would lead to a 404 for dynamic ids.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface LinkEntry {
  id: string;
  image: string;
  urlMobile: string;
  urlDesktop?: string;
}

/**
 * Server component that resolves the provided id to a stored link entry.
 *
 * If the id exists in the data store, it renders a client component that
 * displays the loading image and performs a timed redirect. Otherwise it
 * triggers the notFound() helper to render the 404 page.
 */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  // Params is a promise in Next.js 15; we must await it to retrieve the id
  const { id } = await params;
  const dataFile = path.join(process.cwd(), 'data', 'links.json');
  // Read the data file. If it's missing or invalid, initialise linksData to
  // an empty object instead of returning early. This avoids inadvertently
  // triggering a 404 due to a parse error or missing file.
  let linksData: Record<string, any> = {};
  try {
    const json = await fs.readFile(dataFile, 'utf8');
    linksData = JSON.parse(json);
  } catch {
    linksData = {};
  }
  // Determine if the data is flat or nested. If flat, look up the id
  // directly. If nested, search through all user namespaces to find
  // the entry. If not found return a 404.
  const hasFlatEntries = Object.values(linksData).some(
    (v: any) => v && typeof v === 'object' && 'id' in v
  );
  let entry: LinkEntry | undefined;
  if (hasFlatEntries) {
    entry = linksData[id] as LinkEntry;
  } else {
    for (const user of Object.keys(linksData)) {
      const userEntries = linksData[user] ?? {};
      if (userEntries && typeof userEntries === 'object' && id in userEntries) {
        entry = userEntries[id] as LinkEntry;
        break;
      }
    }
  }
  if (!entry) {
    return notFound();
  }
  return (
    <RedirectComponent
      image={entry.image}
      urlMobile={entry.urlMobile}
      urlDesktop={entry.urlDesktop}
    />
  );
}