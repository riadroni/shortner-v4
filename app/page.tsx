import fs from "fs/promises";
import path from "path";
import Table from "./components/Table";
import Header from "./components/Header";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * The root page loads the existing links from the JSON file on the
 * server and passes them to a client component to render. This page
 * itself is a server component, which makes it easy to read files
 * synchronously at request time.
 */
export default async function HomePage() {
  // Read the username from cookies. If no cookie is present, redirect
  // to the login page. We only perform this check on the server to
  // prevent rendering any of the authenticated UI for anonymous users.
  const cookieStore = cookies();
  const username = (await cookies()).get('username')?.value;
  if (!username) {
    redirect("/login");
  }

  const filePath = path.join(process.cwd(), "data", "links.json");
  let linksData: Record<string, any> = {};
  try {
    const json = await fs.readFile(filePath, "utf8");
    linksData = JSON.parse(json);
  } catch {
    linksData = {};
  }

  // Determine if the data is in flat or nested format. If flat,
  // convert all entries into an array. If nested, pick the user
  // namespace. Note: Object.values returns an array of values for
  // easier iteration.
  const hasFlatEntries = Object.values(linksData).some(
    (v: any) => v && typeof v === "object" && "id" in v
  );
  let initialLinks: any[] = [];
  if (hasFlatEntries) {
    initialLinks = Object.values(linksData);
  } else {
    const userEntries = linksData[username] ?? {};
    initialLinks = Object.values(userEntries);
  }

  return (
    <>
      <Header initialUsername={username} />
      <Table initialLinks={initialLinks} />
    </>
  );
}
